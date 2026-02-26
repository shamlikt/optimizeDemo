from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class UploadResponse(BaseModel):
    id: UUID
    organization_id: UUID
    uploaded_by: UUID
    upload_type: str
    filename: str
    file_hash: Optional[str] = None
    version_number: int
    row_count: int
    valid_row_count: int
    duplicate_count: int
    status: str
    error_message: Optional[str] = None
    is_active: bool
    uploaded_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class UploadListResponse(BaseModel):
    uploads: list[UploadResponse]
    total: int
