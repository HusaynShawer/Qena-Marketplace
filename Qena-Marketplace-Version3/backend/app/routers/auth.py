from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from pydantic import BaseModel
from datetime import datetime, timedelta
import random, string, os, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ADMIN_EMAIL = "husaynshawer@gmail.com"

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────────

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

# ── Helpers ────────────────────────────────────────────────────────────────────

def _send_otp_email(to_email: str, otp: str):
    """Send the OTP via SMTP. Falls back to console log in dev if SMTP_USER is not set."""
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if not smtp_user:
        # Dev fallback — print to console
        print(f"[DEV] Password reset OTP for {to_email}: {otp}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Qena Marketplace — Password Reset Code"
    msg["From"] = smtp_user
    msg["To"] = to_email

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
      <h2 style="color:#1a1a1a">Password Reset</h2>
      <p style="color:#444">Use the code below to reset your Qena Marketplace password.
         It expires in <strong>15 minutes</strong>.</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;
                  padding:24px;background:#f5f5f5;border-radius:8px;margin:24px 0">
        {otp}
      </div>
      <p style="color:#888;font-size:13px">If you didn't request this, ignore this email.</p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())

# ── Existing endpoints ─────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = UserRole("buyer")
    if user_data.role == "seller":
        role = UserRole("seller")

    hashed = hash_password(user_data.password)
    user = User(name=user_data.name, email=user_data.email, password=hashed, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = user.role.value
    if user.email == ADMIN_EMAIL:
        role = "admin"

    token = create_access_token({"sub": str(user.id), "role": role})
    return {"access_token": token}

# ── Reset password endpoints ───────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Step 1 — request OTP. Always returns 200 to avoid email enumeration."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if user:
        otp = "".join(random.choices(string.digits, k=6))
        user.reset_otp = otp
        user.reset_otp_expiry = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        try:
            _send_otp_email(user.email, otp)
        except Exception as e:
            # Don't expose SMTP errors to the client
            print(f"[EMAIL ERROR] {e}")
    return {"message": "If that email is registered you will receive a reset code shortly."}

@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Step 2 — validate the 6-digit code."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or user.reset_otp != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid code.")
    if not user.reset_otp_expiry or datetime.utcnow() > user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="Code has expired. Please request a new one.")
    return {"message": "Code verified."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Step 3 — set the new password."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or user.reset_otp != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid or expired session.")
    if not user.reset_otp_expiry or datetime.utcnow() > user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="Session expired. Start over.")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    user.password = hash_password(payload.new_password)
    user.reset_otp = None
    user.reset_otp_expiry = None
    db.commit()
    return {"message": "Password updated successfully."}