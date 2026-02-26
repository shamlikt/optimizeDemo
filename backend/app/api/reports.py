from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DbSession, OrgId
from app.schemas.report import (
    TechPointsByLocationResponse,
    MonthlyTechPointsResponse,
    ScheduledPointsByProviderResponse,
    PointsPaidTechFteResponse,
    WeeklyPointsByLocationResponse,
)
from app.services.report_service import (
    get_tech_points_by_location,
    get_monthly_tech_points_by_location,
    get_scheduled_points_by_provider,
    get_points_paid_tech_fte,
    get_weekly_points_by_location,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/tech-points-by-location", response_model=TechPointsByLocationResponse)
async def tech_points_by_location(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    location_name: str = Query(..., description="Location name"),
    month: str = Query(..., description="Month in YYYY-MM format"),
    period: str = Query(
        default="four_weeks",
        description="Period: one_week or four_weeks",
    ),
):
    """Get daily AM/PM point totals for each rooming tech at a location.

    Uses retrospective data. Period can be 'one_week' (last 7 days of month)
    or 'four_weeks' (full month).
    """
    if period not in ("one_week", "four_weeks"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period must be 'one_week' or 'four_weeks'",
        )

    return await get_tech_points_by_location(db, org_id, location_name, month, period)


@router.get("/monthly-tech-points-by-location", response_model=MonthlyTechPointsResponse)
async def monthly_tech_points_by_location(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    location_name: str = Query(..., description="Location name"),
    month: str = Query(..., description="Month in YYYY-MM format"),
):
    """Get full month daily AM/PM points for each rooming tech at a location.

    Uses retrospective data.
    """
    return await get_monthly_tech_points_by_location(db, org_id, location_name, month)


@router.get("/scheduled-points-by-provider", response_model=ScheduledPointsByProviderResponse)
async def scheduled_points_by_provider(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    location_name: str = Query(..., description="Location name"),
    month: str = Query(..., description="Month in YYYY-MM format"),
):
    """Get scheduled points by provider at a location.

    Uses prospective data. Groups by location manager -> providers.
    """
    return await get_scheduled_points_by_provider(db, org_id, location_name, month)


@router.get("/points-paid-tech-fte", response_model=PointsPaidTechFteResponse)
async def points_paid_tech_fte(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    month1: str = Query(..., description="First month in YYYY-MM format"),
    month2: str = Query(..., description="Second month in YYYY-MM format"),
):
    """Get points by specialty/location across two months.

    Uses retrospective data. Compares two months side by side.
    """
    return await get_points_paid_tech_fte(db, org_id, month1, month2)


@router.get("/weekly-points-by-location", response_model=WeeklyPointsByLocationResponse)
async def weekly_points_by_location(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    month: str = Query(..., description="Month in YYYY-MM format"),
    week: int = Query(..., ge=1, le=6, description="Week number (1-based)"),
):
    """Get weekly points by location (Mon-Fri).

    Uses prospective data. Shows daily AM/PM/Total for each location.
    """
    return await get_weekly_points_by_location(db, org_id, month, week)
