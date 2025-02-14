# schemas.py
from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime

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
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    blogs: List[BlogResponse] = []

    class Config:
        orm_mode = True