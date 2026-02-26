import calendar
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, func, case, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment
from app.models.location import Location
from app.schemas.report import (
    TechDailyPoints,
    TechPointsSummary,
    TechPointsByLocationResponse,
    MonthlyTechPointsResponse,
    ProviderPointsSummary,
    ManagerProviderPoints,
    ScheduledPointsByProviderResponse,
    SpecialtyLocationPoints,
    PointsPaidTechFteResponse,
    LocationDailyPoints,
    LocationWeeklyPoints,
    WeeklyPointsByLocationResponse,
)


def parse_month(month_str: str) -> tuple[int, int]:
    """Parse YYYY-MM string into (year, month)."""
    parts = month_str.split("-")
    return int(parts[0]), int(parts[1])


def get_month_date_range(year: int, month: int) -> tuple[date, date]:
    """Get start and end dates for a month."""
    start = date(year, month, 1)
    _, last_day = calendar.monthrange(year, month)
    end = date(year, month, last_day)
    return start, end


def get_week_date_range(year: int, month: int, week: int) -> tuple[date, date]:
    """Get Mon-Fri date range for a specific week of a month (1-based).
    Week 1 starts on the first Monday on or before the first of the month,
    or the first day of the month if it falls on a weekday.
    """
    first_day = date(year, month, 1)
    # Find the first Monday
    first_monday = first_day
    while first_monday.weekday() != 0:  # 0 = Monday
        first_monday += timedelta(days=1)

    # If the month starts mid-week, count week 1 from the 1st
    if first_day.weekday() <= 4:  # Mon-Fri
        week_start = first_day + timedelta(weeks=week - 1)
        # Adjust to Monday of that week
        week_start = week_start - timedelta(days=week_start.weekday())
    else:
        week_start = first_monday + timedelta(weeks=week - 1)

    week_end = week_start + timedelta(days=4)  # Friday
    return week_start, week_end


async def get_tech_points_by_location(
    db: AsyncSession,
    org_id: UUID,
    location_name: str,
    month_str: str,
    period: str = "four_weeks",
) -> TechPointsByLocationResponse:
    """Report: Tech points by location for a given period.
    Returns daily AM/PM point totals for each rooming_tech.
    """
    year, month = parse_month(month_str)
    month_start, month_end = get_month_date_range(year, month)

    if period == "one_week":
        # Last 7 days of the month
        end_date = month_end
        start_date = end_date - timedelta(days=6)
    else:
        start_date = month_start
        end_date = month_end

    result = await db.execute(
        select(
            Appointment.rooming_tech,
            Appointment.appointment_date,
            Appointment.session,
            func.sum(Appointment.visit_points).label("total_points"),
        )
        .where(
            Appointment.organization_id == org_id,
            func.lower(Appointment.location_name) == location_name.strip().lower(),
            Appointment.data_type == "retrospective",
            Appointment.is_excluded_from_reporting == False,  # noqa: E712
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date,
            Appointment.rooming_tech.isnot(None),
        )
        .group_by(
            Appointment.rooming_tech,
            Appointment.appointment_date,
            Appointment.session,
        )
        .order_by(Appointment.rooming_tech, Appointment.appointment_date)
    )
    rows = result.all()

    # Organize by tech
    tech_data: dict = {}
    for row in rows:
        tech_name = row.rooming_tech
        if tech_name not in tech_data:
            tech_data[tech_name] = {}

        d = row.appointment_date
        if d not in tech_data[tech_name]:
            tech_data[tech_name][d] = {"am": Decimal("0"), "pm": Decimal("0")}

        if row.session == "AM":
            tech_data[tech_name][d]["am"] += row.total_points or Decimal("0")
        else:
            tech_data[tech_name][d]["pm"] += row.total_points or Decimal("0")

    techs = []
    for tech_name, dates in tech_data.items():
        daily = []
        total_am = Decimal("0")
        total_pm = Decimal("0")
        for d in sorted(dates.keys()):
            am = dates[d]["am"]
            pm = dates[d]["pm"]
            total_am += am
            total_pm += pm
            daily.append(TechDailyPoints(
                date=d,
                day_of_week=d.strftime("%A"),
                am_points=am,
                pm_points=pm,
                total_points=am + pm,
            ))
        techs.append(TechPointsSummary(
            rooming_tech=tech_name,
            daily_points=daily,
            total_am=total_am,
            total_pm=total_pm,
            grand_total=total_am + total_pm,
        ))

    return TechPointsByLocationResponse(
        location_name=location_name,
        period=period,
        month=month_str,
        techs=techs,
    )


async def get_monthly_tech_points_by_location(
    db: AsyncSession,
    org_id: UUID,
    location_name: str,
    month_str: str,
) -> MonthlyTechPointsResponse:
    """Report: Full month daily AM/PM points for each rooming_tech at a location."""
    year, month = parse_month(month_str)
    start_date, end_date = get_month_date_range(year, month)

    result = await db.execute(
        select(
            Appointment.rooming_tech,
            Appointment.appointment_date,
            Appointment.session,
            func.sum(Appointment.visit_points).label("total_points"),
        )
        .where(
            Appointment.organization_id == org_id,
            func.lower(Appointment.location_name) == location_name.strip().lower(),
            Appointment.data_type == "retrospective",
            Appointment.is_excluded_from_reporting == False,  # noqa: E712
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date,
            Appointment.rooming_tech.isnot(None),
        )
        .group_by(
            Appointment.rooming_tech,
            Appointment.appointment_date,
            Appointment.session,
        )
        .order_by(Appointment.rooming_tech, Appointment.appointment_date)
    )
    rows = result.all()

    tech_data: dict = {}
    for row in rows:
        tech_name = row.rooming_tech
        if tech_name not in tech_data:
            tech_data[tech_name] = {}

        d = row.appointment_date
        if d not in tech_data[tech_name]:
            tech_data[tech_name][d] = {"am": Decimal("0"), "pm": Decimal("0")}

        if row.session == "AM":
            tech_data[tech_name][d]["am"] += row.total_points or Decimal("0")
        else:
            tech_data[tech_name][d]["pm"] += row.total_points or Decimal("0")

    techs = []
    for tech_name, dates in tech_data.items():
        daily = []
        total_am = Decimal("0")
        total_pm = Decimal("0")
        for d in sorted(dates.keys()):
            am = dates[d]["am"]
            pm = dates[d]["pm"]
            total_am += am
            total_pm += pm
            daily.append(TechDailyPoints(
                date=d,
                day_of_week=d.strftime("%A"),
                am_points=am,
                pm_points=pm,
                total_points=am + pm,
            ))
        techs.append(TechPointsSummary(
            rooming_tech=tech_name,
            daily_points=daily,
            total_am=total_am,
            total_pm=total_pm,
            grand_total=total_am + total_pm,
        ))

    return MonthlyTechPointsResponse(
        location_name=location_name,
        month=month_str,
        techs=techs,
    )


async def get_scheduled_points_by_provider(
    db: AsyncSession,
    org_id: UUID,
    location_name: str,
    month_str: str,
) -> ScheduledPointsByProviderResponse:
    """Report: Scheduled points by provider (prospective data).
    Groups by manager (from location's manager_name) -> providers.
    """
    year, month = parse_month(month_str)
    start_date, end_date = get_month_date_range(year, month)

    # Get location manager name
    loc_result = await db.execute(
        select(Location.manager_name).where(
            Location.organization_id == org_id,
            func.lower(Location.name) == location_name.strip().lower(),
        )
    )
    manager_name = loc_result.scalar_one_or_none()

    # Query provider points
    result = await db.execute(
        select(
            Appointment.provider,
            Appointment.session,
            func.sum(Appointment.visit_points).label("total_points"),
        )
        .where(
            Appointment.organization_id == org_id,
            func.lower(Appointment.location_name) == location_name.strip().lower(),
            Appointment.data_type == "prospective",
            Appointment.is_excluded_from_reporting == False,  # noqa: E712
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date,
        )
        .group_by(Appointment.provider, Appointment.session)
        .order_by(Appointment.provider)
    )
    rows = result.all()

    provider_data: dict = {}
    for row in rows:
        if row.provider not in provider_data:
            provider_data[row.provider] = {"am": Decimal("0"), "pm": Decimal("0")}
        if row.session == "AM":
            provider_data[row.provider]["am"] += row.total_points or Decimal("0")
        else:
            provider_data[row.provider]["pm"] += row.total_points or Decimal("0")

    providers = []
    total_am = Decimal("0")
    total_pm = Decimal("0")
    for prov_name, points in provider_data.items():
        providers.append(ProviderPointsSummary(
            provider=prov_name,
            am_points=points["am"],
            pm_points=points["pm"],
            total_points=points["am"] + points["pm"],
        ))
        total_am += points["am"]
        total_pm += points["pm"]

    managers = [ManagerProviderPoints(
        manager_name=manager_name,
        location_name=location_name,
        providers=providers,
        total_am=total_am,
        total_pm=total_pm,
        grand_total=total_am + total_pm,
    )]

    return ScheduledPointsByProviderResponse(
        location_name=location_name,
        month=month_str,
        managers=managers,
    )


async def get_points_paid_tech_fte(
    db: AsyncSession,
    org_id: UUID,
    month1_str: str,
    month2_str: str,
) -> PointsPaidTechFteResponse:
    """Report: Points by specialty/location across two months (retrospective)."""
    y1, m1 = parse_month(month1_str)
    y2, m2 = parse_month(month2_str)
    start1, end1 = get_month_date_range(y1, m1)
    start2, end2 = get_month_date_range(y2, m2)

    # Query for both months
    month1_points = (
        select(
            Appointment.specialty,
            Appointment.location_name,
            func.sum(Appointment.visit_points).label("points"),
        )
        .where(
            Appointment.organization_id == org_id,
            Appointment.data_type == "retrospective",
            Appointment.is_excluded_from_reporting == False,  # noqa: E712
            Appointment.appointment_date >= start1,
            Appointment.appointment_date <= end1,
        )
        .group_by(Appointment.specialty, Appointment.location_name)
    )

    month2_points = (
        select(
            Appointment.specialty,
            Appointment.location_name,
            func.sum(Appointment.visit_points).label("points"),
        )
        .where(
            Appointment.organization_id == org_id,
            Appointment.data_type == "retrospective",
            Appointment.is_excluded_from_reporting == False,  # noqa: E712
            Appointment.appointment_date >= start2,
            Appointment.appointment_date <= end2,
        )
        .group_by(Appointment.specialty, Appointment.location_name)
    )

    result1 = await db.execute(month1_points)
    result2 = await db.execute(month2_points)

    rows1 = result1.all()
    rows2 = result2.all()

    # Merge results
    data_map: dict = {}
    for row in rows1:
        key = (row.specialty or "Unknown", row.location_name)
        data_map[key] = {"month1": row.points or Decimal("0"), "month2": Decimal("0")}

    for row in rows2:
        key = (row.specialty or "Unknown", row.location_name)
        if key in data_map:
            data_map[key]["month2"] = row.points or Decimal("0")
        else:
            data_map[key] = {"month1": Decimal("0"), "month2": row.points or Decimal("0")}

    data = [
        SpecialtyLocationPoints(
            specialty=key[0],
            location_name=key[1],
            month1_points=val["month1"],
            month2_points=val["month2"],
        )
        for key, val in sorted(data_map.items())
    ]

    return PointsPaidTechFteResponse(
        month1=month1_str,
        month2=month2_str,
        data=data,
    )


async def get_weekly_points_by_location(
    db: AsyncSession,
    org_id: UUID,
    month_str: str,
    week: int,
) -> WeeklyPointsByLocationResponse:
    """Report: Weekly points by location (prospective, Mon-Fri)."""
    year, month = parse_month(month_str)
    week_start, week_end = get_week_date_range(year, month, week)

    result = await db.execute(
        select(
            Appointment.location_name,
            Appointment.appointment_date,
            Appointment.session,
            func.sum(Appointment.visit_points).label("total_points"),
        )
        .where(
            Appointment.organization_id == org_id,
            Appointment.data_type == "prospective",
            Appointment.is_excluded_from_reporting == False,  # noqa: E712
            Appointment.appointment_date >= week_start,
            Appointment.appointment_date <= week_end,
        )
        .group_by(
            Appointment.location_name,
            Appointment.appointment_date,
            Appointment.session,
        )
        .order_by(Appointment.location_name, Appointment.appointment_date)
    )
    rows = result.all()

    location_data: dict = {}
    for row in rows:
        loc = row.location_name
        if loc not in location_data:
            location_data[loc] = {}

        d = row.appointment_date
        if d not in location_data[loc]:
            location_data[loc][d] = {"am": Decimal("0"), "pm": Decimal("0")}

        if row.session == "AM":
            location_data[loc][d]["am"] += row.total_points or Decimal("0")
        else:
            location_data[loc][d]["pm"] += row.total_points or Decimal("0")

    locations = []
    for loc_name, dates in sorted(location_data.items()):
        daily = []
        total_am = Decimal("0")
        total_pm = Decimal("0")
        for d in sorted(dates.keys()):
            am = dates[d]["am"]
            pm = dates[d]["pm"]
            total_am += am
            total_pm += pm
            daily.append(LocationDailyPoints(
                date=d,
                day_of_week=d.strftime("%A"),
                am_points=am,
                pm_points=pm,
                total_points=am + pm,
            ))
        locations.append(LocationWeeklyPoints(
            location_name=loc_name,
            daily_points=daily,
            total_am=total_am,
            total_pm=total_pm,
            grand_total=total_am + total_pm,
        ))

    return WeeklyPointsByLocationResponse(
        month=month_str,
        week=week,
        locations=locations,
    )
