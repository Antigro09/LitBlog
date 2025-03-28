# main.py
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, get_db, reset_database
from base import Base
import models
import schemas
from typing import List
from pydantic import BaseModel
from passlib.context import CryptContext
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
import shutil
from pathlib import Path
import random
import string
from models import User, Teacher  # Add this line
from bs4 import BeautifulSoup
import bleach
from bleach.css_sanitizer import CSSSanitizer
from google.auth.transport import requests
from google.oauth2 import id_token
import secrets
import random
from msal import ConfidentialClientApplication  # Add this import
from sqlalchemy.orm import relationship

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://drhscit.org:7001", "http://www.drhscit.org:7001"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

class LoginRequest(BaseModel):
    email: str
    password: str

# Add these constants
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Create tables if they don't exist (if you already have tables, this will be a no-op)
Base.metadata.create_all(bind=engine)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# ---------- Authentication Endpoints ----------

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email or username already exists
    db_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

    # Verify access codes based on role (but skip for students)
    if user.role == models.UserRole.TEACHER:
        if not user.access_code or user.access_code != os.getenv("TEACHER_ACCESS_CODE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid teacher code"
            )
    elif user.role == models.UserRole.ADMIN:
        if not user.access_code or user.access_code != os.getenv("ADMIN_ACCESS_CODE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid admin code"
            )

    try:
        # Create the new user
        hashed_password = get_password_hash(user.password)
        new_user = models.User(
            username=user.username,
            email=user.email,
            password=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
            role=models.UserRole[user.role],
            is_admin=(user.role == models.UserRole.ADMIN)
        )
        db.add(new_user)
        db.flush()

        # If the user is a teacher, create a Teacher record
        if user.role == models.UserRole.TEACHER:
            new_teacher = models.Teacher(
                name=f"{user.first_name} {user.last_name}",
                email=user.email,
                hashed_password=hashed_password
            )
            db.add(new_teacher)

        # Commit all changes
        db.commit()
        db.refresh(new_user)

        # Create access token
        access_token = create_access_token(data={"sub": str(new_user.id)})
        
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "role": new_user.role.value,
            "is_admin": new_user.is_admin,
            "created_at": new_user.created_at,
            "token": access_token
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/auth/login")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )
    
    # Check if this is a social login account by trying to verify password
    # If password verification fails, it might be a social account
    if not verify_password(login_data.password, user.password):
        # Check if this user signed up with either Google or Microsoft
        # Since we don't have the ID fields, we need to rely on other signals
        # One approach is to tell users to use social login if password is invalid
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password. If you signed up with Google or Microsoft, please use those login methods."
        )
    
    # Create access token with user ID
    access_token = create_access_token(data={"sub": str(user.id)})

    # Get class info for students
    class_info = None
    if user.role == models.UserRole.STUDENT:
        enrollment = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.student_id == user.id
        ).first()
        if enrollment:
            class_ = db.query(models.Class).filter(
                models.Class.id == enrollment.class_id
            ).first()
            class_info = {
                "id": class_.id,
                "name": class_.name,
                "access_code": class_.access_code
            }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "class_info": class_info,
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin
    }

@app.post("/api/auth/google-signup", response_model=schemas.UserResponse)
async def google_signup(google_data: dict, db: Session = Depends(get_db)):
    """Process Google OAuth sign-up"""
    try:
        # Check if we got an ID token or user info
        if 'token' in google_data:
            # Verify the Google ID token
            idinfo = id_token.verify_oauth2_token(
                google_data['token'], 
                requests.Request(), 
                "653922429771-qdjgvs7vkrcd7g4o2oea12t097ah4eog.apps.googleusercontent.com"
            )
            
            # Extract user info from the verified token
            user_email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            # No longer storing google_id
        
        elif 'googleData' in google_data:
            # Extract user info from the provided data
            user_email = google_data['googleData']['email']
            first_name = google_data['googleData'].get('given_name', '')
            last_name = google_data['googleData'].get('family_name', '')
            # No longer storing google_id
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Google authentication data"
            )
        
        # Check required fields
        role = google_data.get('role')
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role is required"
            )
        
        # Validate access code for teacher/admin
        access_code = google_data.get('accessCode')
        if role in ['TEACHER', 'ADMIN'] and not access_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{role.lower()} access code is required"
            )
        
        # Verify access codes
        if role == 'TEACHER' and access_code != os.getenv("TEACHER_ACCESS_CODE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid teacher access code"
            )
        
        if role == 'ADMIN' and access_code != os.getenv("ADMIN_ACCESS_CODE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid admin access code"
            )
        
        # Check if user already exists by email
        existing_user = db.query(models.User).filter(
            models.User.email == user_email
        ).first()
        
        if existing_user:
            # User already exists, update their details but don't change role
            existing_user.first_name = first_name
            existing_user.last_name = last_name
            # Don't update google_id anymore
            
            db.commit()
            db.refresh(existing_user)
            
            # Generate token for the existing user
            access_token = create_access_token(data={"sub": str(existing_user.id)})
            
            # Return user data
            return {
                "id": existing_user.id,
                "username": existing_user.username,
                "email": existing_user.email,
                "first_name": existing_user.first_name,
                "last_name": existing_user.last_name,
                "role": existing_user.role,
                "token": access_token,
                "is_admin": existing_user.is_admin,
                "created_at": existing_user.created_at
            }
        
        # Create new user
        username = user_email.split('@')[0] + str(random.randint(1000, 9999))
        
        # Generate a random password 
        random_password = secrets.token_hex(16)
        hashed_password = get_password_hash(random_password)
        
        # Create user with the provided role
        new_user = models.User(
            username=username,
            email=user_email,
            password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            # No longer using google_id
            # Do NOT include access_code here - it's not in the User model
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate token for the new user
        access_token = create_access_token(data={"sub": str(new_user.id)})
        
        # Return user data
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "role": new_user.role,
            "token": access_token,
            "is_admin": new_user.is_admin,
            "created_at": new_user.created_at
        }
        
    except Exception as e:
        # Log the full error for debugging
        print(f"Google signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Google sign-up: {str(e)}"
        )

@app.post("/api/auth/google-login")
async def google_login(token_data: dict, db: Session = Depends(get_db)):
    """Process Google login - now with existence check"""
    try:
        # Extract the token
        token = token_data.get('token')
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token is required"
            )
            
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), "653922429771-qdjgvs7vkrcd7g4o2oea12t097ah4eog.apps.googleusercontent.com"
        )
        
        # Extract user info
        email = idinfo['email']
        
        # Check if user exists by email only - don't use google_id
        user = db.query(models.User).filter(models.User.email == email).first()
        
        # If user doesn't exist, require signup
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please sign up and choose a role first."
            )
        
        # Generate token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Get class info for students
        class_info = None
        if user.role == models.UserRole.STUDENT:
            enrollment = db.query(models.ClassEnrollment).filter(
                models.ClassEnrollment.student_id == user.id
            ).first()
            if enrollment:
                class_ = db.query(models.Class).filter(
                    models.Class.id == enrollment.class_id
                ).first()
                if class_:
                    class_info = {
                        "id": class_.id,
                        "name": class_.name,
                        "access_code": class_.access_code
                    }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role.value,
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_admin": user.is_admin,
            "class_info": class_info
        }
        
    except Exception as e:
        print(f"Google login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Google login: {str(e)}"
        )

@app.post("/api/auth/microsoft-login")
async def microsoft_login(microsoft_data: dict, db: Session = Depends(get_db)):
    """Process Microsoft login"""
    try:
        # Extract user info from the Microsoft data
        user_data = microsoft_data['msUserData']
        user_email = user_data['email']
        
        # Check if user exists by email only - don't use microsoft_id
        user = db.query(models.User).filter(models.User.email == user_email).first()
        
        # If user doesn't exist, require signup
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please sign up and choose a role first."
            )
        
        # Generate token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Get class info for students
        class_info = None
        if user.role == models.UserRole.STUDENT:
            enrollment = db.query(models.ClassEnrollment).filter(
                models.ClassEnrollment.student_id == user.id
            ).first()
            if enrollment:
                class_ = db.query(models.Class).filter(
                    models.Class.id == enrollment.class_id
                ).first()
                if class_:
                    class_info = {
                        "id": class_.id,
                        "name": class_.name,
                        "access_code": class_.access_code
                    }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role.value,
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_admin": user.is_admin,
            "class_info": class_info
        }
        
    except Exception as e:
        print(f"Microsoft login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Microsoft login: {str(e)}"
        )

# Add these constants at the top with your other constants
MS_CLIENT_ID = "68975491-3428-4424-bb26-63bd8f7a75ad"
MS_CLIENT_SECRET = "00475c0d-a0ba-46e9-96e0-fbb8c5926b93"  # Add your secret here
MS_AUTHORITY = "https://login.microsoftonline.com/common"

@app.post("/api/auth/microsoft-token")
async def get_microsoft_token(request_data: dict, db: Session = Depends(get_db)):
    """Exchange authorization code for tokens and handle signup"""
    try:
        auth_code = request_data.get('auth_code')
        role = request_data.get('role', 'STUDENT')
        access_code = request_data.get('accessCode')

        # Create MSAL confidential client application
        app = ConfidentialClientApplication(
            client_id=MS_CLIENT_ID,
            client_credential=MS_CLIENT_SECRET,
            authority=MS_AUTHORITY
        )

        # Get tokens using authorization code with correct scopes
        result = app.acquire_token_by_authorization_code(
            code=auth_code,
            scopes=["https://graph.microsoft.com/User.Read"],
            redirect_uri="http://localhost:5173"
        )

        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to get token: {result.get('error_description')}"
            )

        # Get user info from Microsoft Graph
        access_token = result['access_token']
        headers = {'Authorization': f'Bearer {access_token}'}
        graph_response = requests.get(
            'https://graph.microsoft.com/v1.0/me',
            headers=headers
        )
        user_data = graph_response.json()

        # Validate role and access code
        if role not in ["STUDENT", "TEACHER", "ADMIN"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role specified"
            )
        
        if role == "TEACHER" and (not access_code or access_code != os.getenv("TEACHER_ACCESS_CODE")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid teacher access code"
            )
            
        if role == "ADMIN" and (not access_code or access_code != os.getenv("ADMIN_ACCESS_CODE")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid admin access code"
            )

        # Check if user exists
        user = db.query(models.User).filter(
            (models.User.email == user_data['mail']) | 
            (models.User.microsoft_id == user_data['id'])
        ).first()

        if not user:
            # Create new user
            username = user_data['mail'].split('@')[0] + str(random.randint(1000, 9999))
            random_password = secrets.token_hex(16)
            hashed_password = get_password_hash(random_password)
            
            user = models.User(
                username=username,
                email=user_data['mail'],
                password=hashed_password,
                first_name=user_data.get('givenName', ''),
                last_name=user_data.get('surname', ''),
                role=role,
                is_admin=(role == "ADMIN"),
                microsoft_id=user_data['id']
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)

        # Generate our app's token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "role": user.role,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_admin": user.is_admin
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Microsoft signup: {str(e)}"
        )

@app.post("/api/auth/microsoft-signup", response_model=schemas.UserResponse)
async def microsoft_signup(microsoft_data: dict, db: Session = Depends(get_db)):
    """Process Microsoft signup"""
    try:
        # Extract user info from the Microsoft data
        user_data = microsoft_data['msUserData']
        user_email = user_data['email']
        first_name = user_data.get('firstName', '')
        last_name = user_data.get('lastName', '')
        # We're no longer storing microsoft_id
        
        # Check required fields
        role = microsoft_data.get('role')
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role is required"
            )
        
        # Validate access code for teacher/admin
        access_code = microsoft_data.get('accessCode')
        if role in ['TEACHER', 'ADMIN'] and not access_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{role.lower()} access code is required"
            )
        
        # Verify access codes
        if role == 'TEACHER' and access_code != os.getenv("TEACHER_ACCESS_CODE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid teacher access code"
            )
        
        if role == 'ADMIN' and access_code != os.getenv("ADMIN_ACCESS_CODE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid admin access code"
            )
        
        # Check if user already exists by email
        existing_user = db.query(models.User).filter(
            models.User.email == user_email
        ).first()
        
        if existing_user:
            # User already exists, update their details but don't change role
            existing_user.first_name = first_name
            existing_user.last_name = last_name
            # Don't update microsoft_id anymore
            
            db.commit()
            db.refresh(existing_user)
            
            # Generate token for the existing user
            access_token = create_access_token(data={"sub": str(existing_user.id)})
            
            # Return user data
            return {
                "id": existing_user.id,
                "username": existing_user.username,
                "email": existing_user.email,
                "first_name": existing_user.first_name,
                "last_name": existing_user.last_name,
                "role": existing_user.role,
                "token": access_token,
                "is_admin": existing_user.is_admin,
                "created_at": existing_user.created_at
            }
        
        # Create new user
        username = user_email.split('@')[0] + str(random.randint(1000, 9999))
        
        # Generate a random password 
        random_password = secrets.token_hex(16)
        hashed_password = get_password_hash(random_password)
        
        # Create user with the provided role
        new_user = models.User(
            username=username,
            email=user_email,
            password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=role
            # Do NOT include microsoft_id or access_code here
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate token for the new user
        access_token = create_access_token(data={"sub": str(new_user.id)})
        
        # Return user data
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "role": new_user.role,
            "token": access_token,
            "is_admin": new_user.is_admin,
            "created_at": new_user.created_at
        }
        
    except Exception as e:
        # Log the full error for debugging
        print(f"Microsoft signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Microsoft sign-up: {str(e)}"
        )

@app.get("/api/user/{user_id}")
async def get_user_info(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "role": user.role.value,
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name
    }

# ---------- Blog Endpoints ----------

@app.get("/api/blogs", response_model=List[schemas.BlogResponse])
def get_blogs(db: Session = Depends(get_db)):
    blogs = db.query(models.Blog).all()
    return blogs

@app.post("/api/blogs", response_model=schemas.BlogResponse)
def create_blog(blog: schemas.BlogCreate, owner_id: int, db: Session = Depends(get_db)):
    # In a real application, owner_id would come from the authenticated user (e.g., JWT token)
    new_blog = models.Blog(title=blog.title, content=blog.content, owner_id=owner_id)
    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)
    return new_blog

@app.delete("/api/blogs/{blog_id}")
def delete_blog(blog_id: int, db: Session = Depends(get_db)):
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    db.delete(blog)
    db.commit()
    return {"message": "Blog deleted"}

# ---------- Home Endpoint ----------
@app.get("/api/")
def home():
    return {"message": "Welcome to LitBlogs Backend"}

@app.get("/api/test-db")
def test_db(db: Session = Depends(get_db)):
    try:
        # Execute a simple query
        result = db.execute(text("SELECT 1"))
        return {"message": "Successfully connected to the database!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.post("/api/verify-class-code")
def verify_class_code(code_data: dict, db: Session = Depends(get_db)):
    code = code_data.get("code")
    class_ = db.query(models.Class).filter(models.Class.access_code == code).first()
    if not class_:
        raise HTTPException(status_code=400, detail="Invalid class code")
    return {"valid": True, "class_id": class_.id}

@app.post("/api/verify-admin-code")
def verify_admin_code(code_data: dict):
    admin_code = os.getenv("ADMIN_CODE", "your_default_admin_code")
    if code_data.get("code") != admin_code:
        raise HTTPException(status_code=400, detail="Invalid admin code")
    return {"valid": True}

@app.post("/api/update-role")
async def update_role(
    role_data: dict, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.role = role_data["role"]
    
    if role_data["role"] == models.UserRole.STUDENT and "classCode" in role_data:
        class_ = db.query(models.Class).filter(models.Class.access_code == role_data["classCode"]).first()
        if class_:
            enrollment = models.ClassEnrollment(student_id=user.id, class_id=class_.id)
            db.add(enrollment)
    
    db.commit()
    return {"message": "Role updated successfully"}

@app.get("/api/classes/{class_id}/details")
async def get_class_details(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get the class details
    class_details = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_details:
        raise HTTPException(status_code=404, detail="Class not found")

    # Check if user has access to this class
    if current_user.role == models.UserRole.TEACHER:
        # Teachers can access classes they created
        if class_details.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this class")
    elif current_user.role == models.UserRole.STUDENT:
        # Students can access classes they're enrolled in
        enrollment = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.student_id == current_user.id,
            models.ClassEnrollment.class_id == class_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get the teacher info
    teacher = db.query(models.User).filter(models.User.id == class_details.teacher_id).first()

    # Get enrollment count
    enrollment_count = db.query(models.ClassEnrollment).filter(
        models.ClassEnrollment.class_id == class_id
    ).count()

    return {
        "id": class_details.id,
        "name": class_details.name,
        "description": class_details.description,
        "access_code": class_details.access_code,
        "teacher": {
            "id": teacher.id,
            "name": f"{teacher.first_name} {teacher.last_name}",
            "email": teacher.email
        },
        "created_at": class_details.created_at,
        "enrollment_count": enrollment_count,
        "is_teacher": current_user.role == models.UserRole.TEACHER
    }

# Add these new models to handle rich content
class PostContent(BaseModel):
    text: str
    code_snippets: List[dict] = []
    media: List[dict] = []
    polls: List[dict] = []
    expandable_lists: List[dict] = []

def sanitize_html(content: str) -> str:
    # Define allowed tags and attributes
    ALLOWED_TAGS = [
        'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 'strike', 'br', 'ul', 'ol', 'li',
        'blockquote', 'pre', 'code', 'hr', 'a', 'img', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'style', 'b', 'i', 's',
        'font', 'mark', 'del'
    ]
    
    ALLOWED_ATTRIBUTES = {
        '*': ['class', 'style', 'id', 'data-mce-style'],
        'a': ['href', 'title', 'target'],
        'img': ['src', 'alt', 'title'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan', 'scope'],
        'font': ['color', 'size', 'face'],
        'p': ['align', 'style'],
        'div': ['align', 'style'],
        'span': ['style'],
        'h1': ['style'],
        'h2': ['style'],
        'h3': ['style'],
        'h4': ['style'],
        'h5': ['style'],
        'h6': ['style']
    }
    
    # Define allowed CSS properties
    ALLOWED_STYLES = [
        'color', 'background-color', 'font-size', 'text-align', 
        'font-family', 'font-weight', 'font-style', 'text-decoration'
    ]
    
    # Create a CSS sanitizer with allowed styles
    css_sanitizer = CSSSanitizer(allowed_css_properties=ALLOWED_STYLES)
    
    # Create a Bleach cleaner with the allowed tags, attributes, and CSS sanitizer
    cleaner = bleach.Cleaner(
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        css_sanitizer=css_sanitizer,
        strip=False  # Don't strip tags that aren't in the whitelist
    )
    
    # Sanitize the content
    sanitized_content = cleaner.clean(content)
    
    return sanitized_content

@app.post("/api/classes/{class_id}/posts", response_model=schemas.BlogResponse)
async def create_class_post(
    class_id: int,
    post: schemas.BlogCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user has access to this class
    if current_user.role == models.UserRole.STUDENT:
        enrollment = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.student_id == current_user.id,
            models.ClassEnrollment.class_id == class_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    # Sanitize the content while preserving styles
    content = sanitize_html(post.content)
    
    # Process rich content markers
    if post.code_snippets:
        for snippet in post.code_snippets:
            content += f"\n[CODE:{snippet['language']}]{snippet['code']}\n"
    
    # Handle media (images, GIFs) if they exist
    if post.media:
        for media in post.media:
            if media['type'] == 'gif':
                content += f"\n[GIF:{media['url']}]\n"
            elif media['type'] == 'image':
                content += f"\n[IMAGE:{media['url']}]\n"
    
    # Handle polls if they exist
    if post.polls:
        for poll in post.polls:
            options = ','.join(poll['options'])
            content += f"\n[POLL:{options}]\n"
    
    # Handle files if they exist
    if post.files:
        for file in post.files:
            content += f"\n[FILE:{file['name']}|{file['url']}]\n"
    
    # Create new post with processed content
    new_post = models.Blog(
        title=post.title,
        content=content,
        owner_id=current_user.id,
        class_id=class_id
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {
        "id": new_post.id,
        "title": new_post.title,
        "content": new_post.content,
        "created_at": new_post.created_at,
        "owner_id": new_post.owner_id,
        "class_id": new_post.class_id,
        "author": f"{current_user.first_name} {current_user.last_name}",
        "likes": len(new_post.likes) if hasattr(new_post, 'likes') else 0,
        "comments": len(new_post.comments) if hasattr(new_post, 'comments') else 0
    }

@app.get("/api/classes/{class_id}/posts")
async def get_class_posts(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if user has access to this class
    if current_user.role == models.UserRole.STUDENT:
        enrollment = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.student_id == current_user.id,
            models.ClassEnrollment.class_id == class_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    # Get posts with author information
    posts = db.query(models.Blog).filter(
        models.Blog.class_id == class_id
    ).order_by(models.Blog.created_at.desc()).all()
    
    # Format posts with author information
    formatted_posts = []
    for post in posts:
        author = db.query(models.User).filter(models.User.id == post.owner_id).first()
        formatted_posts.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,  # Whitespace will be preserved
            "created_at": post.created_at,
            "author": f"{author.first_name} {author.last_name}" if author else "Unknown Author",
            "likes": len(post.likes) if hasattr(post, 'likes') else 0,
            "comments": len(post.comments) if hasattr(post, 'comments') else 0
        })
    
    return formatted_posts

@app.get("/api/users")
async def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = db.query(models.User).all()
    return users

@app.get("/api/classes")
async def get_classes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Allow both admin and teacher access
    if not (current_user.is_admin or current_user.role == models.UserRole.TEACHER):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # For teachers, only return their classes
    if current_user.role == models.UserRole.TEACHER:
        classes = db.query(models.Class).filter(
            models.Class.teacher_id == current_user.id
        ).all()
    else:  # For admins, return all classes
        classes = db.query(models.Class).all()
    
    # Add student count to each class
    for class_ in classes:
        class_.student_count = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.class_id == class_.id
        ).count()
    
    return classes

@app.get("/api/debug/classes")
async def debug_classes(db: Session = Depends(get_db)):
    classes = db.query(models.Class).all()
    return [{"id": c.id, "name": c.name, "access_code": c.access_code} for c in classes]

# Create upload directories if they don't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)
(UPLOAD_DIR / "videos").mkdir(exist_ok=True)
(UPLOAD_DIR / "files").mkdir(exist_ok=True)

# Add these new endpoints
@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    try:
        file_path = UPLOAD_DIR / "images" / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"url": f"/uploads/images/{file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/video")
async def upload_video(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    try:
        file_path = UPLOAD_DIR / "videos" / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"url": f"/uploads/videos/{file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/file")
async def upload_file(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    try:
        file_path = UPLOAD_DIR / "files" / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"url": f"/uploads/files/{file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teacher/dashboard")
async def get_teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get teacher dashboard data"""
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not a teacher")
    
    # Get teacher info
    teacher = db.query(models.Teacher).filter(models.Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    # Get classes taught by this teacher
    classes = db.query(models.Class).filter(models.Class.teacher_id == teacher.id).all()
    
    classes_data = []
    for class_ in classes:
        # Count enrollments for this class
        enrollment_count = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.class_id == class_.id
        ).count()
        
        # Count posts in this class
        post_count = db.query(models.Blog).filter(
            models.Blog.class_id == class_.id
        ).count()
        
        classes_data.append({
            "id": class_.id,
            "name": class_.name,
            "description": class_.description,
            "access_code": class_.access_code,
            "enrollment_count": enrollment_count,
            "post_count": post_count
        })
    
    return {
        "name": f"{current_user.first_name} {current_user.last_name}",
        "email": current_user.email,
        "classes": classes_data
    }

@app.post("/api/classes")
async def create_class(
    class_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new class (for teachers)"""
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create classes"
        )
    
    try:
        # Find the teacher record for this user
        teacher = db.query(models.Teacher).filter(
            models.Teacher.email == current_user.email
        ).first()
        
        if not teacher:
            # Create a teacher record if it doesn't exist
            teacher = models.Teacher(
                name=f"{current_user.first_name} {current_user.last_name}",
                email=current_user.email,
                user_id=current_user.id
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
        
        # Generate a unique access code
        access_code = generate_unique_code(db)
        
        # Create new class with teacher_id from the Teacher table
        new_class = models.Class(
            name=class_data.get("name"),
            description=class_data.get("description", ""),
            access_code=access_code,
            teacher_id=teacher.id  # Use teacher.id, not current_user.id
        )
        
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        
        return {
            "id": new_class.id,
            "name": new_class.name,
            "description": new_class.description,
            "access_code": new_class.access_code,
            "created_at": new_class.created_at,
            "teacher_id": new_class.teacher_id
        }
    
    except Exception as e:
        db.rollback()
        print(f"Class creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create class: {str(e)}"
        )

@app.get("/api/classes/{class_id}/posts/{post_id}")
async def get_class_post(
    class_id: int,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check access rights
    if current_user.role == models.UserRole.STUDENT:
        enrollment = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.student_id == current_user.id,
            models.ClassEnrollment.class_id == class_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    post = db.query(models.Blog).filter(
        models.Blog.id == post_id,
        models.Blog.class_id == class_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get the author's information
    author = db.query(models.User).filter(models.User.id == post.owner_id).first()
    
    # Return post with author info and content
    return {
        **post.__dict__,
        "author": {
            "id": author.id,
            "first_name": author.first_name,
            "last_name": author.last_name
        },
        "content": post.content  # Content already includes the markers
    }

@app.put("/api/classes/{class_id}/posts/{post_id}")
async def update_class_post(
    class_id: int,
    post_id: int,
    post: schemas.BlogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get the post
    db_post = db.query(models.Blog).filter(
        models.Blog.id == post_id,
        models.Blog.class_id == class_id
    ).first()
    
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user owns the post
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
    
    # Update the post - make sure title and content are both updated
    db_post.title = post.title
    db_post.content = post.content
    db_post.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_post)
    
    # Return updated post
    return {
        "id": db_post.id,
        "title": db_post.title,  # Make sure title is returned
        "content": db_post.content,
        "created_at": db_post.created_at,
        "owner_id": db_post.owner_id,
        "class_id": db_post.class_id,
        "author": f"{current_user.first_name} {current_user.last_name}",
        "likes": len(db_post.likes) if hasattr(db_post, 'likes') else 0,
        "comments": len(db_post.comments) if hasattr(db_post, 'comments') else 0
    }

@app.delete("/api/classes/{class_id}/posts/{post_id}")
async def delete_class_post(
    class_id: int,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get the post
    post = db.query(models.Blog).filter(
        models.Blog.id == post_id,
        models.Blog.class_id == class_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user owns the post
    if post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # Delete the post
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}

# Add this before your app starts
#@app.on_event("startup")
#async def startup_event():
    #reset_database()

def generate_unique_code(db: Session, length: int = 6) -> str:
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        existing = db.query(models.Class).filter(
            models.Class.access_code == code
        ).first()
        if not existing:
            return code

@app.get("/api/student/classes")
async def get_student_classes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not a student")
    
    enrollments = db.query(models.ClassEnrollment).filter(
        models.ClassEnrollment.student_id == current_user.id
    ).all()
    
    classes = []
    for enrollment in enrollments:
        class_ = db.query(models.Class).filter(models.Class.id == enrollment.class_id).first()
        teacher = db.query(models.Teacher).filter(models.Teacher.id == class_.teacher_id).first()
        classes.append({
            "id": class_.id,
            "name": class_.name,
            "description": class_.description,
            "teacher_name": teacher.name
        })
    
    return classes

@app.post("/api/student/join-class")
async def join_class(
    class_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not a student")
    
    class_ = db.query(models.Class).filter(
        models.Class.access_code == class_data["access_code"]
    ).first()
    
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if already enrolled
    existing_enrollment = db.query(models.ClassEnrollment).filter(
        models.ClassEnrollment.student_id == current_user.id,
        models.ClassEnrollment.class_id == class_.id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this class")
    
    enrollment = models.ClassEnrollment(
        student_id=current_user.id,
        class_id=class_.id
    )
    
    db.add(enrollment)
    db.commit()
    
    return {"message": "Successfully joined class"}

@app.get("/api/student/posts")
async def get_student_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not a student")
    
    # Get all posts by the student
    posts = db.query(models.Blog).filter(
        models.Blog.owner_id == current_user.id
    ).order_by(models.Blog.created_at.desc()).all()
    
    # Add class information to each post
    posts_with_class = []
    for post in posts:
        class_ = db.query(models.Class).filter(models.Class.id == post.class_id).first()
        posts_with_class.append({
            **post.__dict__,
            "class_name": class_.name if class_ else "Unknown Class"
        })
    
    return posts_with_class

@app.get("/api/debug/post/{post_id}")
async def debug_post_content(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    post = db.query(models.Blog).filter(models.Blog.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {
        "raw_content": post.content,
        "length": len(post.content)
    }

@app.post("/api/user/update-profile")
async def update_profile(
    profile_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update user profile information"""
    try:
        # Get the user from database
        user = db.query(models.User).filter(models.User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update fields that are present in the request
        if "bio" in profile_data:
            user.bio = profile_data["bio"]
        
        # Update name fields if provided
        if "first_name" in profile_data:
            user.first_name = profile_data["first_name"]
        if "last_name" in profile_data:
            user.last_name = profile_data["last_name"]
            
        db.commit()
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.post("/api/user/upload-profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload profile image"""
    try:
        # Create directory if it doesn't exist
        upload_dir = Path("uploads/profile_images")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{current_user.id}_{int(datetime.now().timestamp())}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update user record in database
        user = db.query(models.User).filter(models.User.id == current_user.id).first()
        user.profile_image = f"/uploads/profile_images/{unique_filename}"
        db.commit()
        
        return {"image_url": user.profile_image}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@app.post("/api/user/upload-cover-image")
async def upload_cover_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload cover image"""
    try:
        # Create directory if it doesn't exist
        upload_dir = Path("uploads/cover_images")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{current_user.id}_{int(datetime.now().timestamp())}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update user record in database
        user = db.query(models.User).filter(models.User.id == current_user.id).first()
        user.cover_image = f"/uploads/cover_images/{unique_filename}"
        db.commit()
        
        return {"image_url": user.cover_image}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@app.get("/api/user/profile")
async def get_user_profile(current_user: models.User = Depends(get_current_user)):
    """Get user profile information"""
    try:
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "bio": current_user.bio,
            "role": current_user.role,
            "profile_image": current_user.profile_image,
            "cover_image": current_user.cover_image,
            "created_at": current_user.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")

@app.post("/api/classes/{class_id}/posts/{post_id}/like")
async def like_post(
    class_id: int,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Like or unlike a post"""
    # Find the post
    post = db.query(models.Blog).filter(
        models.Blog.id == post_id,
        models.Blog.class_id == class_id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if the user already liked this post
    existing_like = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id,
        models.PostLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Unlike - remove the like
        db.delete(existing_like)
        action = "unliked"
    else:
        # Like - add a new like
        new_like = models.PostLike(
            post_id=post_id,
            user_id=current_user.id
        )
        db.add(new_like)
        action = "liked"
    
    db.commit()
    
    # Get updated like count
    like_count = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id
    ).count()
    
    return {
        "action": action,
        "post_id": post_id,
        "like_count": like_count
    }

@app.get("/api/classes/{class_id}/posts/{post_id}/likes")
async def get_post_likes(
    class_id: int,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get likes for a post"""
    # Find the post
    post = db.query(models.Blog).filter(
        models.Blog.id == post_id,
        models.Blog.class_id == class_id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if the current user liked this post
    user_liked = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id,
        models.PostLike.user_id == current_user.id
    ).first() is not None
    
    # Get all likes
    likes = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id
    ).all()
    
    # Get users who liked
    like_users = []
    for like in likes:
        user = db.query(models.User).filter(models.User.id == like.user_id).first()
        if user:
            like_users.append({
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}".strip(),
                "username": user.username
            })
    
    return {
        "post_id": post_id,
        "like_count": len(likes),
        "user_liked": user_liked,
        "users": like_users
    }

@app.get("/api/classes/{class_id}/posts/{post_id}/comments")
async def get_comments(
    class_id: int,
    post_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comments for a post, with pagination support"""
    # Find the post
    post = db.query(models.Blog).filter(
        models.Blog.id == post_id,
        models.Blog.class_id == class_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get root comments first (comments without a parent)
    root_comments = db.query(models.Comment).filter(
        models.Comment.blog_id == post_id,
        models.Comment.parent_id == None
    ).order_by(models.Comment.created_at.desc()).offset(skip).limit(limit).all()
    
    # Function to recursively get comment data with user info and likes
    def get_comment_data(comment, depth=0, max_depth=3):
        # Get user info
        user = db.query(models.User).filter(models.User.id == comment.user_id).first()
        
        # Get like count and current user's like status
        like_count = db.query(models.CommentLike).filter(
            models.CommentLike.comment_id == comment.id
        ).count()
        
        user_liked = db.query(models.CommentLike).filter(
            models.CommentLike.comment_id == comment.id,
            models.CommentLike.user_id == current_user.id
        ).first() is not None
        
        # Get replies, but limit depth to avoid excessive nesting
        replies_data = []
        if depth < max_depth:
            replies = db.query(models.Comment).filter(
                models.Comment.parent_id == comment.id
            ).order_by(models.Comment.created_at).all()
            
            for reply in replies:
                replies_data.append(get_comment_data(reply, depth + 1, max_depth))
        
        # Return formatted comment data
        return {
            "id": comment.id,
            "content": comment.content,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "user": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_image": user.profile_image
            },
            "likes": like_count,
            "user_liked": user_liked,
            "replies": replies_data,
            "has_more_replies": len(comment.replies) > len(replies_data) if depth == max_depth else False,
            "reply_count": len(comment.replies)
        }
    
    # Get formatted comment data for all root comments
    comments_data = [get_comment_data(comment) for comment in root_comments]
    
    # Get total count for pagination
    total_root_comments = db.query(models.Comment).filter(
        models.Comment.blog_id == post_id,
        models.Comment.parent_id == None
    ).count()
    
    return {
        "comments": comments_data,
        "total": total_root_comments,
        "has_more": total_root_comments > skip + limit
    }

@app.get("/api/comments/{comment_id}/replies")
async def get_comment_replies(
    comment_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get replies for a specific comment"""
    # Check if comment exists
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Get replies with pagination
    replies = db.query(models.Comment).filter(
        models.Comment.parent_id == comment_id
    ).order_by(models.Comment.created_at).offset(skip).limit(limit).all()
    
    # Function to format reply data (similar to above but without deep recursion)
    def format_reply(reply):
        user = db.query(models.User).filter(models.User.id == reply.user_id).first()
        
        like_count = db.query(models.CommentLike).filter(
            models.CommentLike.comment_id == reply.id
        ).count()
        
        user_liked = db.query(models.CommentLike).filter(
            models.CommentLike.comment_id == reply.id,
            models.CommentLike.user_id == current_user.id
        ).first() is not None
        
        # Count number of replies to this reply
        reply_count = db.query(models.Comment).filter(
            models.Comment.parent_id == reply.id
        ).count()
        
        return {
            "id": reply.id,
            "content": reply.content,
            "created_at": reply.created_at,
            "updated_at": reply.updated_at,
            "user": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_image": user.profile_image
            },
            "likes": like_count,
            "user_liked": user_liked,
            "reply_count": reply_count,
            "has_replies": reply_count > 0
        }
    
    replies_data = [format_reply(reply) for reply in replies]
    
    # Get total for pagination
    total_replies = db.query(models.Comment).filter(
        models.Comment.parent_id == comment_id
    ).count()
    
    return {
        "replies": replies_data,
        "total": total_replies,
        "has_more": total_replies > skip + limit
    }

@app.post("/api/classes/{class_id}/posts/{post_id}/comments")
async def create_comment(
    class_id: int,
    post_id: int,
    comment_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new comment on a post or reply to another comment"""
    # Find the post
    post = db.query(models.Blog).filter(
        models.Blog.id == post_id,
        models.Blog.class_id == class_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if this is a reply to another comment
    parent_id = comment_data.get("parent_id")
    if parent_id:
        # Verify parent comment exists
        parent_comment = db.query(models.Comment).filter(
            models.Comment.id == parent_id,
            models.Comment.blog_id == post_id
        ).first()
        
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # Create the comment
    new_comment = models.Comment(
        content=comment_data.get("content"),
        user_id=current_user.id,
        blog_id=post_id,
        parent_id=parent_id
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Return the created comment with user info
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    return {
        "id": new_comment.id,
        "content": new_comment.content,
        "created_at": new_comment.created_at,
        "updated_at": new_comment.updated_at,
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile_image": user.profile_image
        },
        "parent_id": parent_id,
        "likes": 0,
        "user_liked": False,
        "replies": []
    }

@app.post("/api/comments/{comment_id}/like")
async def like_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Like or unlike a comment"""
    # Find the comment
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if the user already liked this comment
    existing_like = db.query(models.CommentLike).filter(
        models.CommentLike.comment_id == comment_id,
        models.CommentLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Unlike - remove the like
        db.delete(existing_like)
        action = "unliked"
    else:
        # Like - add a new like
        new_like = models.CommentLike(
            comment_id=comment_id,
            user_id=current_user.id
        )
        db.add(new_like)
        action = "liked"
    
    db.commit()
    
    # Get updated like count
    like_count = db.query(models.CommentLike).filter(
        models.CommentLike.comment_id == comment_id
    ).count()
    
    return {
        "action": action,
        "comment_id": comment_id,
        "like_count": like_count
    }

@app.get("/api/classes/{class_id}/students")
async def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all students enrolled in a class"""
    # Check if user has access to this class
    if current_user.role == models.UserRole.TEACHER:
        # Teachers can access classes they created
        class_details = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not class_details or class_details.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this class")
    elif current_user.role == models.UserRole.STUDENT:
        # Students can access classes they're enrolled in
        enrollment = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.student_id == current_user.id,
            models.ClassEnrollment.class_id == class_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all enrollments for this class
    enrollments = db.query(models.ClassEnrollment).filter(
        models.ClassEnrollment.class_id == class_id
    ).all()
    
    # Get student details for each enrollment
    students = []
    for enrollment in enrollments:
        student = db.query(models.User).filter(models.User.id == enrollment.student_id).first()
        if student:
            # Count posts by this student in this class
            post_count = db.query(models.Blog).filter(
                models.Blog.owner_id == student.id,
                models.Blog.class_id == class_id
            ).count()
            
            students.append({
                "id": student.id,
                "username": student.username,
                "email": student.email,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "posts_count": post_count,
            })
    
    return students

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
