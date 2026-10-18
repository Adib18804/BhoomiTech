from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.schemas.auth import (
    UserRegister, UserLogin, AdminLogin, TokenResponse,
    UserResponse, PasswordResetRequest
)
from app.models.user import User
from app.models.audit import AuditLog, SecurityEvent
from app.api.deps import get_current_user
from app.core.rate_limit import (
    rate_limit_login, rate_limit_admin_login, rate_limit_register, rate_limit_forgot_password
)

router = APIRouter()


def _as_utc(dt: datetime) -> datetime:
    """Normalize a possibly timezone-aware DB datetime to naive UTC for
    comparison with datetime.utcnow()."""
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(rate_limit_register)])
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new citizen user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        # Log security event
        security_event = SecurityEvent(
            event_type="duplicate_registration",
            severity="low",
            email=user_data.email,
            description=f"Attempted duplicate registration for {user_data.email}"
        )
        db.add(security_event)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check mobile if provided
    if user_data.mobile:
        existing_mobile = db.query(User).filter(User.mobile == user_data.mobile).first()
        if existing_mobile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number already registered"
            )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        mobile=user_data.mobile,
        full_name=user_data.full_name,
        password_hash=hashed_password,
        role="citizen",
        is_active=True,
        preferred_language=user_data.preferred_language
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create audit log
    audit_log = AuditLog(
        user_id=new_user.id,
        action_type="registration",
        resource_type="user",
        resource_id=str(new_user.id),
        action_description=f"New citizen registration: {new_user.email}",
        success="success"
    )
    db.add(audit_log)
    db.commit()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(new_user.id), "role": new_user.role})
    refresh_token = create_refresh_token({"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "preferred_language": new_user.preferred_language
        }
    }


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limit_login)])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Citizen login"""

    user = db.query(User).filter(User.email == credentials.email).first()

    # Deterministic temporary lockout (Phase 8): if the account is locked,
    # reject before checking the password.
    if user and user.locked_until:
        locked_until_utc = _as_utc(user.locked_until)
        if locked_until_utc > datetime.utcnow():
            remaining = int((locked_until_utc - datetime.utcnow()).total_seconds() // 60) + 1
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Account temporarily locked due to multiple failed login attempts. Try again in about {remaining} minute(s)."
            )
        # Lock expired: clear it and continue
        user.locked_until = None
        user.failed_login_attempts = 0
        db.commit()

    if not user or not verify_password(credentials.password, user.password_hash):
        # Log failed login
        security_event = SecurityEvent(
            event_type="failed_login",
            severity="medium",
            email=credentials.email,
            description=f"Failed login attempt for {credentials.email}"
        )
        db.add(security_event)

        # Track failed attempts and lock the account when the threshold is
        # reached (only for existing users; the error message never reveals
        # whether the email exists).
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.LOGIN_MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
                security_event = SecurityEvent(
                    event_type="account_locked",
                    severity="high",
                    user_id=user.id,
                    email=user.email,
                    description=f"Account locked for {settings.LOGIN_LOCKOUT_MINUTES} minutes after {user.failed_login_attempts} failed login attempts"
                )
                db.add(security_event)
        db.commit()

        if user and user.locked_until:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Account temporarily locked due to multiple failed login attempts. Try again in about {settings.LOGIN_LOCKOUT_MINUTES} minute(s)."
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    # Reset failed attempts and update last login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user.id,
        action_type="login",
        resource_type="user",
        resource_id=str(user.id),
        action_description=f"User login: {user.email}",
        success="success"
    )
    db.add(audit_log)
    db.commit()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "preferred_language": user.preferred_language
        }
    }


@router.post("/admin/login", response_model=TokenResponse, dependencies=[Depends(rate_limit_admin_login)])
def admin_login(credentials: AdminLogin, db: Session = Depends(get_db)):
    """Admin and Super Admin login"""

    user = db.query(User).filter(User.email == credentials.email).first()

    # Deterministic temporary lockout (Phase 8), same policy as citizen login
    if user and user.locked_until:
        locked_until_utc = _as_utc(user.locked_until)
        if locked_until_utc > datetime.utcnow():
            remaining = int((locked_until_utc - datetime.utcnow()).total_seconds() // 60) + 1
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Account temporarily locked due to multiple failed login attempts. Try again in about {remaining} minute(s)."
            )
        user.locked_until = None
        user.failed_login_attempts = 0
        db.commit()

    if not user or not verify_password(credentials.password, user.password_hash):
        # Log failed admin login attempt
        security_event = SecurityEvent(
            event_type="failed_admin_login",
            severity="high",
            email=credentials.email,
            description=f"Failed admin login attempt for {credentials.email}"
        )
        db.add(security_event)

        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.LOGIN_MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
                security_event = SecurityEvent(
                    event_type="account_locked",
                    severity="high",
                    user_id=user.id,
                    email=user.email,
                    description=f"Admin account locked for {settings.LOGIN_LOCKOUT_MINUTES} minutes after {user.failed_login_attempts} failed login attempts"
                )
                db.add(security_event)
        db.commit()

        if user and user.locked_until:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Account temporarily locked due to multiple failed login attempts. Try again in about {settings.LOGIN_LOCKOUT_MINUTES} minute(s)."
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )
    
    # Check if user has admin or super_admin role
    if user.role not in ["admin", "super_admin"]:
        security_event = SecurityEvent(
            event_type="unauthorized_admin_access",
            severity="high",
            user_id=user.id,
            email=user.email,
            description=f"Non-admin user attempted admin login: {user.email}"
        )
        db.add(security_event)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Create audit log
    audit_log = AuditLog(
        user_id=user.id,
        action_type="admin_login",
        resource_type="user",
        resource_id=str(user.id),
        action_description=f"Admin login: {user.email} (role: {user.role})",
        success="success"
    )
    db.add(audit_log)
    db.commit()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "preferred_language": user.preferred_language
        }
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout current user"""
    
    # Create audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action_type="logout",
        resource_type="user",
        resource_id=str(current_user.id),
        action_description=f"User logout: {current_user.email}",
        success="success"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/forgot-password", dependencies=[Depends(rate_limit_forgot_password)])
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset"""
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success to prevent email enumeration
    # In production, send email with reset link
    
    if user:
        # Log password reset request
        audit_log = AuditLog(
            user_id=user.id,
            action_type="password_reset_request",
            resource_type="user",
            resource_id=str(user.id),
            action_description=f"Password reset requested for {user.email}",
            success="success"
        )
        db.add(audit_log)
        db.commit()
    
    return {"message": "If the email exists, a password reset link will be sent"}
