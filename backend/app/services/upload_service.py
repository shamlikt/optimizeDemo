import hashlib
import io
import math
from datetime import datetime, time, timezone
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Optional, Tuple
from uuid import UUID

import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment
from app.models.appointment_type import AppointmentType
from app.models.location import Location
from app.models.upload import Upload


# Column name mappings for normalization
RETROSPECTIVE_COLUMN_MAP = {
    "department": "department",
    "location": "location_name",
    "provider": "provider",
    "specialty": "specialty",
    "rooming tech": "rooming_tech",
    "patient encounter number": "patient_encounter_number",
    "appt date": "appointment_date",
    "appt time": "appointment_time",
    "session": "session",
    "visit type": "visit_type",
    "visit points": "visit_points",
    "check in": "check_in_staff",
    "check in time": "check_in_time",
    "check in comment": "check_in_comment",
    "check out time": "check_out_time",
    "check out comment": "check_out_comment",
    "visit duration min": "visit_duration_min",
    "total wait duration": "total_wait_duration",
    "tech level": "tech_level",
    "rooming time": "rooming_time",
    "rooming comment": "rooming_comment",
    "tech in": "tech_in",
    "tech out": "tech_out",
    "tech duration": "tech_duration",
    "tech comment": "tech_comment",
    "check in to tech": "check_in_to_tech",
    "appt time to tech": "appt_time_to_tech",
    "pt check time": "pt_check_time",
    "primary diagnosis": "primary_diagnosis",
    "day of week": "day_of_week",
    "week of month": "week_of_month",
    "appt comments": "appt_comments",
}

PROSPECTIVE_COLUMN_MAP = {
    "department": "department",
    "location": "location_name",
    "provider": "provider",
    "specialty": "specialty",
    "patient encounter number": "patient_encounter_number",
    "appt date": "appointment_date",
    "appt time": "appointment_time",
    "session": "session",
    "visit type": "visit_type",
    "visit points": "visit_points",
    "day of week": "day_of_week",
    "week of month": "week_of_month",
    "appt comments": "appt_comments",
}


def compute_file_hash(file_content: bytes) -> str:
    """Compute SHA-256 hash of file content."""
    return hashlib.sha256(file_content).hexdigest()


def parse_time_value(value) -> Optional[time]:
    """Parse various time formats into a Python time object."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if isinstance(value, time):
        return value
    if isinstance(value, datetime):
        return value.time()
    if isinstance(value, pd.Timestamp):
        return value.time()

    s = str(value).strip()
    if not s or s.lower() == "nan":
        return None

    # Try various formats
    for fmt in ("%I:%M %p", "%I:%M:%S %p", "%H:%M", "%H:%M:%S", "%I:%M%p"):
        try:
            return datetime.strptime(s, fmt).time()
        except ValueError:
            continue

    # Try pandas parsing
    try:
        ts = pd.Timestamp(s)
        return ts.time()
    except Exception:
        return None


def parse_date_value(value):
    """Parse various date formats into a Python date object."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, pd.Timestamp):
        return value.date()
    if hasattr(value, "date"):
        return value

    s = str(value).strip()
    if not s or s.lower() == "nan":
        return None

    try:
        ts = pd.to_datetime(s)
        return ts.date()
    except Exception:
        return None


def parse_numeric(value) -> Optional[Decimal]:
    """Parse a numeric value to Decimal."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    try:
        return Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        return None


def parse_int(value) -> Optional[int]:
    """Parse a value to int."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    try:
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return None


def safe_str(value) -> Optional[str]:
    """Convert to string safely, returning None for NaN/empty."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    s = str(value).strip()
    return s if s and s.lower() != "nan" else None


def determine_session(appt_time: Optional[time], session_val: Optional[str]) -> Optional[str]:
    """Determine AM/PM session from time or explicit value."""
    if session_val and session_val.strip().upper() in ("AM", "PM"):
        return session_val.strip().upper()
    if appt_time is not None:
        return "AM" if appt_time.hour < 12 else "PM"
    return None


def normalize_columns(df: pd.DataFrame, column_map: Dict[str, str]) -> pd.DataFrame:
    """Normalize DataFrame column names using the provided mapping."""
    # Create a lowercase-to-original mapping
    rename_map = {}
    for col in df.columns:
        col_lower = col.strip().lower()
        if col_lower in column_map:
            rename_map[col] = column_map[col_lower]
    df = df.rename(columns=rename_map)
    return df


def read_file_to_dataframe(file_content: bytes, filename: str) -> pd.DataFrame:
    """Read CSV or Excel file content into a pandas DataFrame."""
    buffer = io.BytesIO(file_content)
    lower_name = filename.lower()

    if lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
        df = pd.read_excel(buffer, engine="openpyxl")
    elif lower_name.endswith(".csv"):
        df = pd.read_csv(buffer)
    else:
        raise ValueError(f"Unsupported file format: {filename}. Use .csv, .xlsx, or .xls")

    return df


def validate_required_columns(df: pd.DataFrame, upload_type: str) -> List[str]:
    """Validate that required columns are present. Returns list of missing columns."""
    if upload_type == "retrospective":
        required = [
            "location_name",
            "rooming_tech",
            "provider",
            "specialty",
            "appointment_date",
            "appointment_time",
            "check_in_staff",
        ]
    else:
        required = [
            "location_name",
            "provider",
            "specialty",
            "appointment_date",
            "appointment_time",
        ]

    missing = [col for col in required if col not in df.columns]
    return missing


async def get_point_value_map(
    db: AsyncSession, org_id: UUID
) -> Dict[str, Tuple[UUID, Decimal]]:
    """Build a map of visit_type_name (lowered) -> (appointment_type_id, point_value)."""
    result = await db.execute(
        select(AppointmentType).where(
            AppointmentType.organization_id == org_id,
            AppointmentType.is_active == True,  # noqa: E712
        )
    )
    types = result.scalars().all()
    return {
        at.name.strip().lower(): (at.id, at.point_value)
        for at in types
    }


async def get_or_create_location(
    db: AsyncSession, org_id: UUID, location_name: str
) -> Optional[UUID]:
    """Get or create a location by name within the organization. Returns location_id."""
    if not location_name:
        return None

    result = await db.execute(
        select(Location).where(
            Location.organization_id == org_id,
            func.lower(Location.name) == location_name.strip().lower(),
        )
    )
    location = result.scalar_one_or_none()
    if location:
        return location.id

    # Auto-create
    new_location = Location(
        organization_id=org_id,
        name=location_name.strip(),
    )
    db.add(new_location)
    await db.flush()
    return new_location.id


async def get_next_version(
    db: AsyncSession, org_id: UUID, upload_type: str
) -> int:
    """Get the next version number for this upload type within the org."""
    result = await db.execute(
        select(func.max(Upload.version_number)).where(
            Upload.organization_id == org_id,
            Upload.upload_type == upload_type,
        )
    )
    max_version = result.scalar_one_or_none()
    return (max_version or 0) + 1


async def deactivate_previous_uploads(
    db: AsyncSession, org_id: UUID, upload_type: str
) -> None:
    """Mark all previous active uploads of the same type as inactive."""
    result = await db.execute(
        select(Upload).where(
            Upload.organization_id == org_id,
            Upload.upload_type == upload_type,
            Upload.is_active == True,  # noqa: E712
        )
    )
    previous_uploads = result.scalars().all()
    for up in previous_uploads:
        up.is_active = False


def detect_duplicates_retrospective(rows: List[dict]) -> List[dict]:
    """Mark within-file duplicates for retrospective data.
    Duplicate key: Provider + Location + Appt Date + Appt Time + Visit Type + Rooming Tech
    """
    seen = set()
    for row in rows:
        key = (
            (row.get("provider") or "").lower(),
            (row.get("location_name") or "").lower(),
            str(row.get("appointment_date")),
            str(row.get("appointment_time")),
            (row.get("visit_type") or "").lower(),
            (row.get("rooming_tech") or "").lower(),
        )
        if key in seen:
            row["is_duplicate"] = True
            row["is_excluded_from_reporting"] = True
            row["exclusion_reason"] = "WITHIN_FILE_DUPLICATE"
        else:
            seen.add(key)
    return rows


def detect_duplicates_prospective(rows: List[dict]) -> List[dict]:
    """Mark within-file duplicates for prospective data.
    Duplicate key: Provider + Location + Appt Date + Appt Time + Visit Type
    """
    seen = set()
    for row in rows:
        key = (
            (row.get("provider") or "").lower(),
            (row.get("location_name") or "").lower(),
            str(row.get("appointment_date")),
            str(row.get("appointment_time")),
            (row.get("visit_type") or "").lower(),
        )
        if key in seen:
            row["is_duplicate"] = True
            row["is_excluded_from_reporting"] = True
            row["exclusion_reason"] = "WITHIN_FILE_DUPLICATE"
        else:
            seen.add(key)
    return rows


async def process_upload(
    db: AsyncSession,
    org_id: UUID,
    user_id: UUID,
    upload_type: str,
    filename: str,
    file_content: bytes,
) -> Upload:
    """Process an uploaded file and create appointments.

    Steps:
    1. Read file to DataFrame
    2. Normalize column names
    3. Validate required columns
    4. Look up point values
    5. Detect duplicates
    6. Create Upload record
    7. Deactivate previous uploads
    8. Bulk insert appointments
    9. Auto-create locations
    """
    file_hash = compute_file_hash(file_content)

    # Read file
    try:
        df = read_file_to_dataframe(file_content, filename)
    except Exception as e:
        upload = Upload(
            organization_id=org_id,
            uploaded_by=user_id,
            upload_type=upload_type,
            filename=filename,
            file_hash=file_hash,
            status="failed",
            error_message=f"Failed to read file: {str(e)}",
        )
        db.add(upload)
        await db.flush()
        return upload

    if df.empty:
        upload = Upload(
            organization_id=org_id,
            uploaded_by=user_id,
            upload_type=upload_type,
            filename=filename,
            file_hash=file_hash,
            status="failed",
            error_message="File is empty",
        )
        db.add(upload)
        await db.flush()
        return upload

    # Normalize columns
    column_map = RETROSPECTIVE_COLUMN_MAP if upload_type == "retrospective" else PROSPECTIVE_COLUMN_MAP
    df = normalize_columns(df, column_map)

    # Validate required columns
    missing = validate_required_columns(df, upload_type)
    if missing:
        upload = Upload(
            organization_id=org_id,
            uploaded_by=user_id,
            upload_type=upload_type,
            filename=filename,
            file_hash=file_hash,
            status="failed",
            error_message=f"Missing required columns: {', '.join(missing)}",
        )
        db.add(upload)
        await db.flush()
        return upload

    # Get point value map
    point_map = await get_point_value_map(db, org_id)

    # Build location cache
    location_cache: Dict[str, UUID] = {}

    # Process rows
    rows = []
    total_rows = len(df)
    valid_rows = 0

    for idx, row_data in df.iterrows():
        try:
            location_name = safe_str(row_data.get("location_name"))
            if not location_name:
                continue

            provider = safe_str(row_data.get("provider"))
            if not provider:
                continue

            appointment_date = parse_date_value(row_data.get("appointment_date"))
            if appointment_date is None:
                continue

            appointment_time = parse_time_value(row_data.get("appointment_time"))
            if appointment_time is None:
                continue

            visit_type = safe_str(row_data.get("visit_type"))
            if not visit_type:
                continue

            # Resolve location
            loc_key = location_name.strip().lower()
            if loc_key not in location_cache:
                loc_id = await get_or_create_location(db, org_id, location_name)
                location_cache[loc_key] = loc_id
            location_id = location_cache[loc_key]

            # Resolve points from DB appointment types (CSV visit_points column is ignored)
            vt_lower = visit_type.strip().lower()
            appointment_type_id = None

            if vt_lower in point_map:
                appointment_type_id, visit_points = point_map[vt_lower]
            else:
                visit_points = Decimal("0")

            # Determine session
            session_val = safe_str(row_data.get("session"))
            session = determine_session(appointment_time, session_val)

            # Day of week
            day_of_week = safe_str(row_data.get("day_of_week"))
            if not day_of_week and appointment_date:
                day_of_week = appointment_date.strftime("%A")

            # Week of month
            week_of_month = parse_int(row_data.get("week_of_month"))
            if week_of_month is None and appointment_date:
                week_of_month = (appointment_date.day - 1) // 7 + 1

            appt_row = {
                "organization_id": org_id,
                "data_type": upload_type,
                "department": safe_str(row_data.get("department")),
                "location_id": location_id,
                "location_name": location_name,
                "provider": provider,
                "specialty": safe_str(row_data.get("specialty")),
                "patient_encounter_number": safe_str(row_data.get("patient_encounter_number")),
                "appointment_date": appointment_date,
                "day_of_week": day_of_week,
                "week_of_month": week_of_month,
                "appointment_time": appointment_time,
                "session": session,
                "visit_type": visit_type,
                "visit_points": visit_points,
                "appointment_type_id": appointment_type_id,
                "appt_comments": safe_str(row_data.get("appt_comments")),
                "source": "csv",
                "row_number": int(idx) + 1,
                "is_duplicate": False,
                "is_excluded_from_reporting": False,
                "exclusion_reason": None,
            }

            # Retrospective-only fields
            if upload_type == "retrospective":
                appt_row.update({
                    "rooming_tech": safe_str(row_data.get("rooming_tech")),
                    "check_in_staff": safe_str(row_data.get("check_in_staff")),
                    "check_in_time": parse_time_value(row_data.get("check_in_time")),
                    "check_in_comment": safe_str(row_data.get("check_in_comment")),
                    "check_out_time": parse_time_value(row_data.get("check_out_time")),
                    "check_out_comment": safe_str(row_data.get("check_out_comment")),
                    "visit_duration_min": parse_numeric(row_data.get("visit_duration_min")),
                    "total_wait_duration": parse_numeric(row_data.get("total_wait_duration")),
                    "tech_level": safe_str(row_data.get("tech_level")),
                    "rooming_time": parse_time_value(row_data.get("rooming_time")),
                    "rooming_comment": safe_str(row_data.get("rooming_comment")),
                    "tech_in": parse_time_value(row_data.get("tech_in")),
                    "tech_out": parse_time_value(row_data.get("tech_out")),
                    "tech_duration": parse_numeric(row_data.get("tech_duration")),
                    "tech_comment": safe_str(row_data.get("tech_comment")),
                    "check_in_to_tech": parse_numeric(row_data.get("check_in_to_tech")),
                    "appt_time_to_tech": parse_numeric(row_data.get("appt_time_to_tech")),
                    "pt_check_time": parse_numeric(row_data.get("pt_check_time")),
                    "primary_diagnosis": safe_str(row_data.get("primary_diagnosis")),
                })

            rows.append(appt_row)
            valid_rows += 1

        except Exception:
            # Skip problematic rows silently
            continue

    # Detect duplicates
    if upload_type == "retrospective":
        rows = detect_duplicates_retrospective(rows)
    else:
        rows = detect_duplicates_prospective(rows)

    duplicate_count = sum(1 for r in rows if r.get("is_duplicate"))

    # Get next version and deactivate previous
    version_number = await get_next_version(db, org_id, upload_type)
    await deactivate_previous_uploads(db, org_id, upload_type)

    # Create upload record
    upload = Upload(
        organization_id=org_id,
        uploaded_by=user_id,
        upload_type=upload_type,
        filename=filename,
        file_hash=file_hash,
        version_number=version_number,
        row_count=total_rows,
        valid_row_count=valid_rows,
        duplicate_count=duplicate_count,
        status="completed",
    )
    db.add(upload)
    await db.flush()

    # Bulk insert appointments
    for row in rows:
        row["upload_id"] = upload.id
        appt = Appointment(**row)
        db.add(appt)

    await db.flush()

    return upload
