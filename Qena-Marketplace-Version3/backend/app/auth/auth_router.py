from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from pydantic import BaseModel
from datetime import datetime, timedelta
import random, string, os, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.user.user_service import UserService

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "buyer"

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

auth_router = APIRouter()

@auth_router.post("/register", response_model=UserResponse)
async def register(user_create: UserCreate, db: Session = Depends(get_db)):
    existing_user = await UserService.get_user_by_email(db, user_create.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_create.password)
    new_user = User(
        name=user_create.name,
        email=user_create.email,
        password=hashed_password,
        role=UserRole(user_create.role)
    )
    await UserService.create_user(db, new_user)
    return new_user

@auth_router.post("/login", response_model=TokenResponse)
async def login(login_request: LoginRequest, db: Session = Depends(get_db)):
    user = await UserService.get_user_by_email(db, login_request.email)
    if not user or not verify_password(login_request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=access_token)

@auth_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = await UserService.get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = ''.join(random.choices(string.digits, k=6))
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.utcnow() + timedelta(minutes=15)
    await UserService.update_user(db, user)
    
    # Send OTP via email (implementation omitted for brevity)
    
    return {"message": "OTP sent to your email."}