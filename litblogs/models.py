# models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Enum as SQLAlchemyEnum, Boolean
from sqlalchemy.orm import relationship
from base import Base
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    role = Column(SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    google_id = Column(String, nullable=True, unique=True)
    # For students: the classes they're enrolled in
    enrolled_classes = relationship("ClassEnrollment", back_populates="student")
    blogs = relationship("Blog", back_populates="owner")

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", backref="teacher_profile")
    classes = relationship("Class", back_populates="teacher")

class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    access_code = Column(String(6), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    teacher = relationship("Teacher", back_populates="classes")
    students = relationship("ClassEnrollment", back_populates="class_")
    blogs = relationship("Blog", back_populates="class_")

class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    student = relationship("User", back_populates="enrolled_classes")
    class_ = relationship("Class", back_populates="students")

class Blog(Base):
    __tablename__ = "blogs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    owner = relationship("User", back_populates="blogs")
    class_ = relationship("Class", back_populates="blogs")
    likes = relationship("BlogLike", back_populates="blog")
    comments = relationship("Comment", back_populates="blog")

class BlogLike(Base):
    __tablename__ = "blog_likes"
    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blogs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    blog = relationship("Blog", back_populates="likes")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    blog_id = Column(Integer, ForeignKey("blogs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    blog = relationship("Blog", back_populates="comments")