from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, UploadFile, File, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, OrgId
from app.models.upload import Upload
from app.schemas.upload import UploadResponse, UploadListResponse
from app.services.upload_service import process_upload

router = APIRouter(prefix="/uploads", tags=["Uploads"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/retrospective", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_retrospective(
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
    file: UploadFile = File(...),
):
    """Upload a retrospective Excel/CSV file (admin only).
    Parses the file, calculates visit points, detects duplicates, and creates appointments.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    # Validate file extension
    lower_name = file.filename.lower()
    if not any(lower_name.endswith(ext) for ext in (".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Accepted: .csv, .xlsx, .xls",
        )

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum size of 50MB",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )

    upload = await process_upload(
        db=db,
        org_id=org_id,
        user_id=admin.id,
        upload_type="retrospective",
        filename=file.filename,
        file_content=content,
    )

    if upload.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=upload.error_message or "Failed to process file",
        )

    return UploadResponse.model_validate(upload)


@router.post("/prospective", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_prospective(
    admin: AdminUser,
    db: DbSession,
    org_id: OrgId,
    file: UploadFile = File(...),
):
    """Upload a prospective Excel/CSV file (admin only).
    Parses the file, calculates visit points from appointment types, detects duplicates.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    lower_name = file.filename.lower()
    if not any(lower_name.endswith(ext) for ext in (".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Accepted: .csv, .xlsx, .xls",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum size of 50MB",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )

    upload = await process_upload(
        db=db,
        org_id=org_id,
        user_id=admin.id,
        upload_type="prospective",
        filename=file.filename,
        file_content=content,
    )

    if upload.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=upload.error_message or "Failed to process file",
        )

    return UploadResponse.model_validate(upload)


@router.get("/", response_model=UploadListResponse)
async def list_uploads(
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
    upload_type: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """List upload history for the organization."""
    query = select(Upload).where(Upload.organization_id == org_id)

    if upload_type:
        query = query.where(Upload.upload_type == upload_type)
    if is_active is not None:
        query = query.where(Upload.is_active == is_active)

    query = query.order_by(Upload.uploaded_at.desc())
    result = await db.execute(query)
    uploads = result.scalars().all()

    return UploadListResponse(
        uploads=[UploadResponse.model_validate(u) for u in uploads],
        total=len(uploads),
    )


@router.get("/{upload_id}", response_model=UploadResponse)
async def get_upload(
    upload_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    org_id: OrgId,
):
    """Get upload details."""
    result = await db.execute(
        select(Upload).where(
            Upload.id == upload_id,
            Upload.organization_id == org_id,
        )
    )
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found",
        )

    return UploadResponse.model_validate(upload)
