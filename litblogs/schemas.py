# schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Blog schemas
class BlogBase(BaseModel):
    title: str
    content: str

class BlogCreate(BlogBase):
    pass

class BlogResponse(BlogBase):
    id: int
    created_at: datetime
    owner_id: int

    class Config:
        orm_mode = True

# User schemas
class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.STUDENT
    class_code: Optional[str] = None  # For students joining a class

class UserResponse(UserBase):
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        orm_mode = True

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    access_code: str
    teacher_id: int
    created_at: datetime

    class Config:
        orm_mode = True