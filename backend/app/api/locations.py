from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, OrgId
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/", response_model=List[LocationResponse])
async def list_locations(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
):
    """List all locations in the organization."""
    result = await db.execute(
        select(Location)
        .where(Location.organization_id == org_id, Location.is_active == True)  # noqa: E712
        .order_by(Location.name)
    )
    locations = result.scalars().all()
    return [LocationResponse.model_validate(loc) for loc in locations]


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """Create a new location (admin only)."""
    new_location = Location(
        organization_id=org_id,
        name=location_data.name,
        abbreviation=location_data.abbreviation,
        address=location_data.address,
        city=location_data.city,
        state=location_data.state,
        postal_code=location_data.postal_code,
        manager_name=location_data.manager_name,
        num_employees=location_data.num_employees,
    )
    db.add(new_location)
    await db.flush()
    await db.refresh(new_location)

    return LocationResponse.model_validate(new_location)


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: UUID,
    location_data: LocationUpdate,
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """Update a location (admin only)."""
    result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.organization_id == org_id,
        )
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )

    update_fields = location_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(location, field, value)

    await db.flush()
    await db.refresh(location)

    return LocationResponse.model_validate(location)
