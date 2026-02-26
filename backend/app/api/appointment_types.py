from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, OrgId
from app.models.appointment_type import AppointmentType
from app.schemas.appointment_type import (
    AppointmentTypeCreate,
    AppointmentTypeUpdate,
    AppointmentTypeResponse,
)

router = APIRouter(prefix="/appointment-types", tags=["Appointment Types"])


@router.get("/", response_model=List[AppointmentTypeResponse])
async def list_appointment_types(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
):
    """List all appointment types with their point values."""
    result = await db.execute(
        select(AppointmentType)
        .where(
            AppointmentType.organization_id == org_id,
            AppointmentType.is_active == True,  # noqa: E712
        )
        .order_by(AppointmentType.name)
    )
    types = result.scalars().all()
    return [AppointmentTypeResponse.model_validate(at) for at in types]


@router.post("/", response_model=AppointmentTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment_type(
    data: AppointmentTypeCreate,
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """Create a new appointment type (admin only)."""
    # Check for duplicate name
    existing = await db.execute(
        select(AppointmentType).where(
            AppointmentType.organization_id == org_id,
            AppointmentType.name == data.name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An appointment type with this name already exists",
        )

    new_type = AppointmentType(
        organization_id=org_id,
        name=data.name,
        point_value=data.point_value,
    )
    db.add(new_type)
    await db.flush()
    await db.refresh(new_type)

    return AppointmentTypeResponse.model_validate(new_type)


@router.put("/{type_id}", response_model=AppointmentTypeResponse)
async def update_appointment_type(
    type_id: UUID,
    data: AppointmentTypeUpdate,
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
):
    """Update an appointment type (admin only)."""
    result = await db.execute(
        select(AppointmentType).where(
            AppointmentType.id == type_id,
            AppointmentType.organization_id == org_id,
        )
    )
    appt_type = result.scalar_one_or_none()
    if not appt_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment type not found",
        )

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(appt_type, field, value)

    await db.flush()
    await db.refresh(appt_type)

    return AppointmentTypeResponse.model_validate(appt_type)
