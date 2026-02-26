from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from decimal import Decimal


class AppointmentTypeCreate(BaseModel):
    name: str
    point_value: Decimal


class AppointmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    point_value: Optional[Decimal] = None
    is_active: Optional[bool] = None


class AppointmentTypeResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    point_value: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
