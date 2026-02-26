from typing import List, Optional

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession, OrgId
from app.schemas.dashboard import DashboardOverviewResponse, LocationTableResponse
from app.services.dashboard_service import get_dashboard_overview, get_location_table

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
async def dashboard_overview(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    locations: Optional[str] = Query(
        default=None,
        description="Comma-separated location names to filter by",
    ),
    days: int = Query(default=10, ge=1, le=365, description="Number of days for trend data"),
):
    """Get dashboard overview with tech points trend and summary stats.

    Optionally filter by location names (comma-separated).
    """
    location_names = None
    if locations:
        location_names = [loc.strip() for loc in locations.split(",") if loc.strip()]

    return await get_dashboard_overview(db, org_id, location_names, days)


@router.get("/location-table", response_model=LocationTableResponse)
async def dashboard_location_table(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    search: Optional[str] = Query(
        default=None,
        description="Search keyword to filter locations",
    ),
):
    """Get location table data with employee counts, YTD/MTD points, and manager names."""
    return await get_location_table(db, org_id, search)
