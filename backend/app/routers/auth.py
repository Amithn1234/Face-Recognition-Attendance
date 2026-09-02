from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.core.dependencies import get_current_admin
from app.models.admin import Admin
from app.schemas.auth import LoginRequest, TokenResponse, AuthMeResponse, AdminResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate admin via username or email and bcrypt password.
    Returns JWT access token.
    """
    identifier = login_data.username_or_email.strip()
    admin = db.query(Admin).filter(
        (Admin.username == identifier) | (Admin.email == identifier.lower()),
        Admin.is_active == True
    ).first()

    if not admin or not verify_password(login_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Issue JWT Token
    access_token = create_access_token(
        data={"sub": admin.id, "username": admin.username, "role": admin.role}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

@router.get("/me", response_model=AuthMeResponse)
def get_me(current_admin: Admin = Depends(get_current_admin)):
    """
    Returns current authenticated admin profile.
    """
    return AuthMeResponse(admin=AdminResponse.model_validate(current_admin))
