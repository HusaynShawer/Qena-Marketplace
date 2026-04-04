from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from pydantic import BaseModel

ADMIN_EMAIL = "husaynshawer@gmail.com"

router = APIRouter()

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

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Force role — nobody can self-register as admin
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

    # Always give admin role to the admin email
    role = user.role.value
    if user.email == ADMIN_EMAIL:
        role = "admin"

    token = create_access_token({"sub": str(user.id), "role": role})
    return {"access_token": token}
