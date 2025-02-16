# schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum
from pydantic import validator

# Blog schemas
class BlogBase(BaseModel):
    title: str
    content: str

class BlogCreate(BaseModel):
    title: str
    content: str

class BlogResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    owner_id: int
    class_id: int

    class Config:
        from_attributes = True

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

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str | None = None
    last_name: str | None = None
    role: str
    access_code: str | None = None

    @validator('role')
    def validate_role(cls, v):
        if v not in ["STUDENT", "TEACHER", "ADMIN"]:
            raise ValueError('Invalid role')
        return v

class ClassInfo(BaseModel):
    id: int
    name: str
    access_code: str

class UserResponse(UserBase):
    id: int
    role: str
    is_admin: bool = False
    created_at: datetime
    token: str | None = None
    class_info: ClassInfo | None = None

    class Config:
        from_attributes = True

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

class TeacherBase(BaseModel):
    id: int
    name: str
    email: str
    classes: List[ClassBase]

class TeacherCreate(BaseModel):
    name: str
    email: str
    password: str

class Teacher(TeacherBase):
    class Config:
        orm_mode = True