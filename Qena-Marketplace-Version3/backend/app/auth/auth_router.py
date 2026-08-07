import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from app.core.database import get_db
from app.models.user import User, UserRole
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, timedelta
import random, string, os, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.user.user_service import UserService
from app.schemas.auth import (UserCreate, LoginRequest,
                              TokenResponse, UserResponse,
                              ForgotPasswordRequest, VerifyOTPRequest,
                              ResetPasswordRequest)

logger = logging.getLogger(__name__)

auth_router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@auth_router.post("/register", response_model=UserResponse)
async def register(user_create: UserCreate, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    existing_user = await user_service.get_by_email(email=user_create.email)
    if existing_user:
        logger.warning("Registration failed: email %s already registered", user_create.email)
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_create.password)
    new_user = User(
        name=user_create.name,
        email=user_create.email,
        password=hashed_password,
        role=UserRole(user_create.role)
    )
    await user_service.create_user(new_user)
    logger.info("New user registered: %s (id: %s)", new_user.email, str(new_user.id))
    return new_user

@auth_router.post("/login", response_model=TokenResponse)
async def login(
    login_request: LoginRequest,
    session: AsyncSession = Depends(get_db),
):
    user_service = UserService(session)
    user = await user_service.get_by_email(login_request.email)

    if not user or not verify_password(
        login_request.password,
        user.password,
    ):
        logger.warning("Login failed for email: %s", login_request.email)
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )
    logger.info("User %s logged in successfully", str(user.id))
    return TokenResponse(access_token=access_token)

@auth_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.get_by_email(email=request.email)
    if not user:
        logger.warning("Forgot password requested for non-existent email: %s", request.email)
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = ''.join(random.choices(string.digits, k=6))
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.utcnow() + timedelta(minutes=15)
    await user_service.update_user(user)
    
    # Send OTP via email (implementation omitted for brevity)
    logger.info("OTP generated for user %s (expires in 15 min)", str(user.id))    
    return {"message": "OTP sent to your email."}