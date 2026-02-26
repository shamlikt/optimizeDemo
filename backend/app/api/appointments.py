from datetime import date, time
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func

from app.api.deps import CurrentUser, DbSession, OrgId
from app.models.appointment import Appointment
from app.models.appointment_type import AppointmentType
from app.models.location import Location
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentBatchCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AppointmentListResponse,
)
from app.services.upload_service import determine_session

router = APIRouter(prefix="/appointments", tags=["Appointments"])


async def resolve_appointment_fields(
    db, org_id: UUID, data: AppointmentCreate
) -> dict:
    """Resolve location_id, appointment_type_id, visit_points, and session for an appointment."""
    # Resolve location_id
    location_id = None
    if data.location_name:
        loc_result = await db.execute(
            select(Location).where(
                Location.organization_id == org_id,
                func.lower(Location.name) == data.location_name.strip().lower(),
            )
        )
        location = loc_result.scalar_one_or_none()
        if location:
            location_id = location.id

    # Resolve appointment type and points
    appointment_type_id = None
    visit_points = data.visit_points

    if data.visit_type:
        at_result = await db.execute(
            select(AppointmentType).where(
                AppointmentType.organization_id == org_id,
                func.lower(AppointmentType.name) == data.visit_type.strip().lower(),
                AppointmentType.is_active == True,  # noqa: E712
            )
        )
        appt_type = at_result.scalar_one_or_none()
        if appt_type:
            appointment_type_id = appt_type.id
            if visit_points is None:
                visit_points = appt_type.point_value

    if visit_points is None:
        visit_points = Decimal("0")

    # Determine session
    session = determine_session(data.appointment_time, data.session)

    # Day of week and week of month
    day_of_week = data.appointment_date.strftime("%A") if data.appointment_date else None
    week_of_month = (
        (data.appointment_date.day - 1) // 7 + 1 if data.appointment_date else None
    )

    return {
        "location_id": location_id,
        "appointment_type_id": appointment_type_id,
        "visit_points": visit_points,
        "session": session,
        "day_of_week": day_of_week,
        "week_of_month": week_of_month,
    }


@router.post("/", response_model=List[AppointmentResponse], status_code=status.HTTP_201_CREATED)
async def create_appointments(
    data: AppointmentBatchCreate,
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
):
    """Create one or more appointments (manual entry)."""
    created = []
    for appt_data in data.appointments:
        resolved = await resolve_appointment_fields(db, org_id, appt_data)

        appt = Appointment(
            organization_id=org_id,
            data_type=appt_data.data_type,
            department=appt_data.department,
            location_id=resolved["location_id"],
            location_name=appt_data.location_name,
            provider=appt_data.provider,
            specialty=appt_data.specialty,
            patient_encounter_number=appt_data.patient_encounter_number,
            appointment_date=appt_data.appointment_date,
            day_of_week=resolved["day_of_week"],
            week_of_month=resolved["week_of_month"],
            appointment_time=appt_data.appointment_time,
            session=resolved["session"],
            visit_type=appt_data.visit_type,
            visit_points=resolved["visit_points"],
            appointment_type_id=resolved["appointment_type_id"],
            appt_comments=appt_data.appt_comments,
            rooming_tech=appt_data.rooming_tech,
            check_in_time=appt_data.check_in_time,
            check_in_comment=appt_data.check_in_comment,
            check_out_time=appt_data.check_out_time,
            check_out_comment=appt_data.check_out_comment,
            visit_duration_min=appt_data.visit_duration_min,
            total_wait_duration=appt_data.total_wait_duration,
            tech_level=appt_data.tech_level,
            rooming_time=appt_data.rooming_time,
            rooming_comment=appt_data.rooming_comment,
            tech_in=appt_data.tech_in,
            tech_out=appt_data.tech_out,
            tech_duration=appt_data.tech_duration,
            tech_comment=appt_data.tech_comment,
            check_in_to_tech=appt_data.check_in_to_tech,
            appt_time_to_tech=appt_data.appt_time_to_tech,
            pt_check_time=appt_data.pt_check_time,
            primary_diagnosis=appt_data.primary_diagnosis,
            source="manual",
            is_draft=appt_data.is_draft,
        )
        db.add(appt)
        created.append(appt)

    await db.flush()
    for appt in created:
        await db.refresh(appt)

    return [AppointmentResponse.model_validate(a) for a in created]


@router.get("/", response_model=AppointmentListResponse)
async def list_appointments(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    location_name: Optional[str] = None,
    data_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    provider: Optional[str] = None,
    upload_id: Optional[UUID] = None,
    include_excluded: bool = False,
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
):
    """List appointments with filters."""
    query = select(Appointment).where(
        Appointment.organization_id == org_id,
        Appointment.is_draft == False,  # noqa: E712
    )

    if not include_excluded:
        query = query.where(Appointment.is_excluded_from_reporting == False)  # noqa: E712

    if location_name:
        query = query.where(
            func.lower(Appointment.location_name) == location_name.strip().lower()
        )
    if data_type:
        query = query.where(Appointment.data_type == data_type)
    if date_from:
        query = query.where(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.where(Appointment.appointment_date <= date_to)
    if provider:
        query = query.where(
            func.lower(Appointment.provider).contains(provider.strip().lower())
        )
    if upload_id:
        query = query.where(Appointment.upload_id == upload_id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination
    query = query.order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time,
    ).limit(limit).offset(offset)

    result = await db.execute(query)
    appointments = result.scalars().all()

    return AppointmentListResponse(
        appointments=[AppointmentResponse.model_validate(a) for a in appointments],
        total=total,
    )


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: UUID,
    data: AppointmentUpdate,
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
):
    """Update an appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.organization_id == org_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    update_fields = data.model_dump(exclude_unset=True)

    # If visit_type changed, recalculate points
    if "visit_type" in update_fields and update_fields["visit_type"]:
        at_result = await db.execute(
            select(AppointmentType).where(
                AppointmentType.organization_id == org_id,
                func.lower(AppointmentType.name) == update_fields["visit_type"].strip().lower(),
                AppointmentType.is_active == True,  # noqa: E712
            )
        )
        appt_type = at_result.scalar_one_or_none()
        if appt_type:
            appt.appointment_type_id = appt_type.id
            if "visit_points" not in update_fields or update_fields["visit_points"] is None:
                appt.visit_points = appt_type.point_value

    # If location_name changed, update location_id
    if "location_name" in update_fields and update_fields["location_name"]:
        loc_result = await db.execute(
            select(Location).where(
                Location.organization_id == org_id,
                func.lower(Location.name) == update_fields["location_name"].strip().lower(),
            )
        )
        loc = loc_result.scalar_one_or_none()
        appt.location_id = loc.id if loc else None

    # Recalculate session if time changed
    if "appointment_time" in update_fields:
        new_time = update_fields.get("appointment_time")
        new_session = update_fields.get("session")
        appt.session = determine_session(new_time, new_session)

    for field, value in update_fields.items():
        if field in ("visit_type", "location_name"):
            setattr(appt, field, value)
        elif hasattr(appt, field):
            setattr(appt, field, value)

    # Recalculate day_of_week and week_of_month if date changed
    if appt.appointment_date:
        appt.day_of_week = appt.appointment_date.strftime("%A")
        appt.week_of_month = (appt.appointment_date.day - 1) // 7 + 1

    await db.flush()
    await db.refresh(appt)

    return AppointmentResponse.model_validate(appt)


@router.delete("/{appointment_id}", status_code=status.HTTP_200_OK)
async def delete_appointment(
    appointment_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
):
    """Delete an appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.organization_id == org_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    await db.delete(appt)
    await db.flush()

    return {"message": "Appointment deleted successfully"}


@router.post("/draft", response_model=List[AppointmentResponse], status_code=status.HTTP_201_CREATED)
async def save_draft(
    data: AppointmentBatchCreate,
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
):
    """Save appointments as drafts."""
    # Force is_draft=True
    for appt_data in data.appointments:
        appt_data.is_draft = True

    created = []
    for appt_data in data.appointments:
        resolved = await resolve_appointment_fields(db, org_id, appt_data)

        appt = Appointment(
            organization_id=org_id,
            data_type=appt_data.data_type,
            department=appt_data.department,
            location_id=resolved["location_id"],
            location_name=appt_data.location_name,
            provider=appt_data.provider,
            specialty=appt_data.specialty,
            patient_encounter_number=appt_data.patient_encounter_number,
            appointment_date=appt_data.appointment_date,
            day_of_week=resolved["day_of_week"],
            week_of_month=resolved["week_of_month"],
            appointment_time=appt_data.appointment_time,
            session=resolved["session"],
            visit_type=appt_data.visit_type,
            visit_points=resolved["visit_points"],
            appointment_type_id=resolved["appointment_type_id"],
            appt_comments=appt_data.appt_comments,
            rooming_tech=appt_data.rooming_tech,
            source="manual",
            is_draft=True,
        )
        db.add(appt)
        created.append(appt)

    await db.flush()
    for appt in created:
        await db.refresh(appt)

    return [AppointmentResponse.model_validate(a) for a in created]


@router.get("/drafts", response_model=AppointmentListResponse)
async def list_drafts(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
):
    """List draft appointments."""
    query = select(Appointment).where(
        Appointment.organization_id == org_id,
        Appointment.is_draft == True,  # noqa: E712
    )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(
        Appointment.created_at.desc(),
    ).limit(limit).offset(offset)

    result = await db.execute(query)
    appointments = result.scalars().all()

    return AppointmentListResponse(
        appointments=[AppointmentResponse.model_validate(a) for a in appointments],
        total=total,
    )
