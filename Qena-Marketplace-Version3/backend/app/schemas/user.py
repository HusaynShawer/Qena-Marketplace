from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserRole

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.BUYER

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None