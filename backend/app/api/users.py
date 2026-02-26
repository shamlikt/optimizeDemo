from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, DbSession, OrgId
from app.models.user import User
from app.models.location import Location, user_locations
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserWithLocationsResponse,
    UserBranchAssignment,
)
from app.services.auth_service import hash_password

router = APIRouter(prefix="/users", tags=["Users"])

VALID_ROLES = {"clinic_admin", "clinic_manager"}


@router.get("/", response_model=List[UserWithLocationsResponse])
async def list_users(
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """List all users in the organization (admin only)."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.locations))
        .where(User.organization_id == org_id)
        .order_by(User.full_name, User.email)
    )
    users = result.scalars().all()

    response = []
    for user in users:
        response.append(UserWithLocationsResponse(
            id=user.id,
            organization_id=user.organization_id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            location_ids=[loc.id for loc in user.locations],
        ))

    return response


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """Create a new user in the organization (admin only)."""
    if user_data.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}",
        )

    # Check for existing user with same email in org
    existing = await db.execute(
        select(User).where(
            User.organization_id == org_id,
            User.email == user_data.email,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists in the organization",
        )

    new_user = User(
        organization_id=org_id,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)

    return UserResponse.model_validate(new_user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """Update a user (admin only)."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.organization_id == org_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_data.role is not None and user_data.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}",
        )

    update_fields = user_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(user, field, value)

    await db.flush()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def deactivate_user(
    user_id: UUID,
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """Deactivate a user (admin only). Sets is_active to False."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.organization_id == org_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    user.is_active = False
    await db.flush()

    return {"message": "User deactivated successfully"}


@router.put("/{user_id}/locations", response_model=UserWithLocationsResponse)
async def update_user_locations(
    user_id: UUID,
    assignment: UserBranchAssignment,
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """Update a user's location assignments (admin only)."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.locations))
        .where(User.id == user_id, User.organization_id == org_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Verify all location IDs belong to this org
    if assignment.location_ids:
        loc_result = await db.execute(
            select(Location).where(
                Location.id.in_(assignment.location_ids),
                Location.organization_id == org_id,
            )
        )
        valid_locations = loc_result.scalars().all()
        if len(valid_locations) != len(assignment.location_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more location IDs are invalid",
            )
        user.locations = valid_locations
    else:
        user.locations = []

    await db.flush()
    await db.refresh(user)

    return UserWithLocationsResponse(
        id=user.id,
        organization_id=user.organization_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        location_ids=[loc.id for loc in user.locations],
    )
