import logging
import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User, UserRole
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.user.user_service import UserService
from app.services.email_service import send_otp_email
from app.schemas.auth import (
    UserCreate, LoginRequest, TokenResponse, UserResponse,
    ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest,
    ResendOTPRequest
)

logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

# ───────────────────────────────────────────────
# REGISTER (Send OTP, don't activate yet)
# ───────────────────────────────────────────────
@auth_router.post("/register", response_model=dict)
@auth_router.post("/register", response_model=dict)
async def register(user_create: UserCreate, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    
    existing = await user_service.get_by_email(user_create.email)
    
    if existing and existing.is_verified:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate new OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    if existing:
        # Update existing unverified user
        user = existing
        user.name = user_create.name
        user.password = hash_password(user_create.password)
        user.role = UserRole(user_create.role)
        user.email_otp = otp
        user.email_otp_expiry = datetime.utcnow() + timedelta(minutes=15)
        await user_service.update_user(user)
        logger.info("Updated unverified user %s with new OTP", user_create.email)
    else:
        # Create new user
        user = User(
            name=user_create.name,
            email=user_create.email,
            password=hash_password(user_create.password),
            role=UserRole(user_create.role),
            email_otp=otp,
            email_otp_expiry=datetime.utcnow() + timedelta(minutes=15),
            is_verified=False
        )
        await user_service.create_user(user)
        logger.info("New user registered: %s", user_create.email)
    
    try:
        await send_otp_email(user_create.email, otp, purpose="verification")
    except Exception as e:
        logger.error("Failed to send email: %s", str(e))
    
    return {
        "message": "OTP sent to your email. Please verify to complete registration.",
        "email": user_create.email
    }

# ───────────────────────────────────────────────
# VERIFY EMAIL OTP (Activate account)
# ───────────────────────────────────────────────
@auth_router.post("/verify-email", response_model=TokenResponse)
async def verify_email(request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.get_by_email(request.email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    if not user.email_otp or user.email_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.utcnow() > user.email_otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Activate user
    user.is_verified = True
    user.email_otp = None
    user.email_otp_expiry = None
    await user_service.update_user(user)
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    logger.info("User %s verified email successfully", str(user.id))
    
    return TokenResponse(access_token=access_token)

# ───────────────────────────────────────────────
# RESEND OTP
# ───────────────────────────────────────────────
@auth_router.post("/resend-otp")
async def resend_otp(request: ResendOTPRequest, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.get_by_email(request.email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new OTP
    otp = ''.join(random.choices(string.digits, k=6))
    user.email_otp = otp
    user.email_otp_expiry = datetime.utcnow() + timedelta(minutes=15)
    await user_service.update_user(user)
    
    await send_otp_email(request.email, otp, purpose="verification")
    
    return {"message": "New OTP sent to your email."}

# ───────────────────────────────────────────────
# LOGIN (Only verified users)
# ───────────────────────────────────────────────
@auth_router.post("/login", response_model=TokenResponse)
async def login(login_request: LoginRequest, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.get_by_email(login_request.email)

    if not user or not verify_password(login_request.password, user.password):
        logger.warning("Login failed for email: %s", login_request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first.",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    logger.info("User %s logged in successfully", str(user.id))
    return TokenResponse(access_token=access_token)

# ───────────────────────────────────────────────
# FORGOT PASSWORD (Send reset OTP)
# ───────────────────────────────────────────────
@auth_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.get_by_email(email=request.email)
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, OTP will be sent."}
    
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    
    otp = ''.join(random.choices(string.digits, k=6))
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.utcnow() + timedelta(minutes=15)
    await user_service.update_user(user)
    
    # Send real email
    await send_otp_email(request.email, otp, purpose="password reset")
    
    logger.info("Password reset OTP sent to %s", request.email)
    return {"message": "If email exists, OTP will be sent."}

# ───────────────────────────────────────────────
# VERIFY RESET OTP (Check before allowing reset)
# ───────────────────────────────────────────────
@auth_router.post("/verify-reset-otp")
async def verify_reset_otp(request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.get_by_email(request.email)
    
    if not user or not user.is_verified:
        raise HTTPException(status_code=404, detail="Invalid request")
    
    if not user.reset_otp or user.reset_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.utcnow() > user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    return {"message": "OTP verified. You can now reset your password."}

# ───────────────────────────────────────────────
# RESET PASSWORD
# ───────────────────────────────────────────────
@auth_router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.get_by_email(request.email)
    
    if not user or not user.is_verified:
        raise HTTPException(status_code=404, detail="Invalid request")
    
    if not user.reset_otp or user.reset_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.utcnow() > user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Update password
    user.password = hash_password(request.new_password)
    user.reset_otp = None
    user.reset_otp_expiry = None
    await user_service.update_user(user)
    
    logger.info("Password reset successful for user %s", str(user.id))
    return {"message": "Password reset successfully. Please login with your new password."}