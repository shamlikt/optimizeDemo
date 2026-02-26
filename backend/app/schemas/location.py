from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class LocationCreate(BaseModel):
    name: str
    abbreviation: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    manager_name: Optional[str] = None
    num_employees: int = 0


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    manager_name: Optional[str] = None
    num_employees: Optional[int] = None
    is_active: Optional[bool] = None


class LocationResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    abbreviation: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    manager_name: Optional[str] = None
    num_employees: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
