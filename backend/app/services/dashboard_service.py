from datetime import date, timedelta, timezone, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, func, and_, extract, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment
from app.models.location import Location
from app.schemas.dashboard import (
    TrendDataPoint,
    DashboardOverviewResponse,
    LocationTableRow,
    LocationTableResponse,
)


async def get_dashboard_overview(
    db: AsyncSession,
    org_id: UUID,
    location_names: Optional[List[str]] = None,
    days: int = 10,
) -> DashboardOverviewResponse:
    """Get dashboard overview with trend data and summary stats.

    Args:
        db: Database session
        org_id: Organization ID from JWT
        location_names: Optional list of location names to filter by
        days: Number of days for trend data (default 10)
    """
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    # Base filter conditions
    base_conditions = [
        Appointment.organization_id == org_id,
        Appointment.is_excluded_from_reporting == False,  # noqa: E712
        Appointment.data_type == "retrospective",
    ]

    if location_names:
        base_conditions.append(
            func.lower(Appointment.location_name).in_(
                [ln.strip().lower() for ln in location_names]
            )
        )

    # Total points (all time)
    total_result = await db.execute(
        select(
            func.coalesce(func.sum(Appointment.visit_points), 0).label("total_points"),
            func.count(Appointment.id).label("total_appointments"),
        ).where(*base_conditions)
    )
    total_row = total_result.one()
    total_points = Decimal(str(total_row.total_points))
    total_appointments = total_row.total_appointments

    # Active locations count
    loc_result = await db.execute(
        select(func.count(func.distinct(Appointment.location_name)))
        .where(*base_conditions)
    )
    active_locations = loc_result.scalar_one()

    # Trend data: daily points for the last N days
    trend_conditions = base_conditions + [
        Appointment.appointment_date >= start_date,
        Appointment.appointment_date <= today,
    ]
    trend_result = await db.execute(
        select(
            Appointment.appointment_date,
            func.coalesce(func.sum(Appointment.visit_points), 0).label("day_points"),
            func.count(Appointment.id).label("day_count"),
        )
        .where(*trend_conditions)
        .group_by(Appointment.appointment_date)
        .order_by(Appointment.appointment_date)
    )
    trend_rows = trend_result.all()

    # Build trend data, filling in missing days with zeros
    trend_map = {row.appointment_date: row for row in trend_rows}
    trend_data = []
    total_trend_points = Decimal("0")
    active_days = 0

    current = start_date
    while current <= today:
        if current in trend_map:
            row = trend_map[current]
            pts = Decimal(str(row.day_points))
            cnt = row.day_count
            total_trend_points += pts
            active_days += 1
        else:
            pts = Decimal("0")
            cnt = 0

        trend_data.append(TrendDataPoint(
            date=current,
            total_points=pts,
            appointment_count=cnt,
        ))
        current += timedelta(days=1)

    avg_points_per_day = (
        total_trend_points / active_days if active_days > 0 else Decimal("0")
    )

    return DashboardOverviewResponse(
        total_points=total_points,
        total_appointments=total_appointments,
        avg_points_per_day=avg_points_per_day.quantize(Decimal("0.01")),
        active_locations=active_locations,
        trend_data=trend_data,
    )


async def get_location_table(
    db: AsyncSession,
    org_id: UUID,
    search: Optional[str] = None,
) -> LocationTableResponse:
    """Get location table data with employee counts, YTD points, and manager names."""
    today = date.today()
    year_start = date(today.year, 1, 1)
    month_start = date(today.year, today.month, 1)

    # Get locations
    location_query = select(Location).where(
        Location.organization_id == org_id,
        Location.is_active == True,  # noqa: E712
    )
    if search:
        location_query = location_query.where(
            func.lower(Location.name).contains(search.strip().lower())
        )
    location_query = location_query.order_by(Location.name)

    loc_result = await db.execute(location_query)
    locations = loc_result.scalars().all()

    # Get YTD points per location
    ytd_result = await db.execute(
        select(
            func.lower(Appointment.location_name).label("loc_name"),
            func.coalesce(func.sum(Appointment.visit_points), 0).label("ytd_points"),
            func.count(Appointment.id).label("appt_count"),
        )
        .where(
            Appointment.organization_id == org_id,
            Appointment.is_excluded_from_reporting == False,  # noqa: E712
            Appointment.data_type == "retrospective",
            Appointment.appointment_date >= year_start,
            Appointment.appointment_date <= today,
        )
        .group_by(func.lower(Appointment.location_name))
    )
    ytd_rows = ytd_result.all()
    ytd_map = {row.loc_name: row for row in ytd_rows}

    # Get MTD points per location
    mtd_result = await db.execute(
        select(
            func.lower(Appointment.location_name).label("loc_name"),
            func.coalesce(func.sum(Appointment.visit_points), 0).label("mtd_points"),
        )
        .where(
            Appointment.organization_id == org_id,
            Appointment.is_excluded_from_reporting == False,  # noqa: E712
            Appointment.data_type == "retrospective",
            Appointment.appointment_date >= month_start,
            Appointment.appointment_date <= today,
        )
        .group_by(func.lower(Appointment.location_name))
    )
    mtd_rows = mtd_result.all()
    mtd_map = {row.loc_name: row for row in mtd_rows}

    rows = []
    for loc in locations:
        loc_lower = loc.name.strip().lower()
        ytd_data = ytd_map.get(loc_lower)
        mtd_data = mtd_map.get(loc_lower)

        rows.append(LocationTableRow(
            location_name=loc.name,
            location_id=str(loc.id),
            num_employees=loc.num_employees or 0,
            manager_name=loc.manager_name,
            ytd_points=Decimal(str(ytd_data.ytd_points)) if ytd_data else Decimal("0"),
            mtd_points=Decimal(str(mtd_data.mtd_points)) if mtd_data else Decimal("0"),
            appointment_count=ytd_data.appt_count if ytd_data else 0,
        ))

    return LocationTableResponse(
        locations=rows,
        total=len(rows),
    )
