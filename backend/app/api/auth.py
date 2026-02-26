from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession, OrgId
from app.schemas.auth import LoginRequest, TokenResponse, UserMeResponse
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_organization_name,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: DbSession):
    """Authenticate user and return a JWT token."""
    user = await authenticate_user(db, request.email, request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        user_id=user.id,
        org_id=user.organization_id,
        role=user.role,
    )

    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserMeResponse)
async def get_me(current_user: CurrentUser, db: DbSession):
    """Get the current authenticated user's info."""
    org_name = await get_organization_name(db, current_user.organization_id)

    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        organization_id=current_user.organization_id,
        organization_name=org_name,
    )


@router.post("/logout")
async def logout():
    """Logout endpoint. Token invalidation is handled client-side."""
    return {"message": "Successfully logged out"}
