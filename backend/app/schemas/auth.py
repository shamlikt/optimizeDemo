from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    organization_id: UUID
    organization_name: Optional[str] = None

    model_config = {"from_attributes": True}
