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
        if not user.access_code or user.access_code != os.getenv("TEACHER_CODE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid teacher code"
            )
    elif user.role == models.UserRole.ADMIN:
        if not user.access_code or user.access_code != os.getenv("ADMIN_CODE"):
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
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Create access token with user ID (not email)
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
@app.get("/")
def home():
    return {"message": "Welcome to LitBlogs Backend"}

@app.get("/test-db")
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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.role == models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    teacher = db.query(models.Teacher).filter(
        models.Teacher.email == current_user.email
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher record not found")
    
    return {
        "id": teacher.id,
        "name": teacher.name,
        "email": teacher.email,
        "classes": [
            {
                "id": cls.id,
                "name": cls.name,
                "description": cls.description,
                "access_code": cls.access_code,
                "students": [
                    {
                        "id": enrollment.student_id,
                        "name": f"{enrollment.student.first_name} {enrollment.student.last_name}"
                    }
                    for enrollment in cls.students
                ]
            }
            for cls in teacher.classes
        ]
    }

@app.post("/api/classes")
async def create_class(
    class_data: schemas.ClassCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.role == models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create classes")
    
    teacher = db.query(models.Teacher).filter(
        models.Teacher.email == current_user.email
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher record not found")
    
    new_class = models.Class(
        name=class_data.name,
        description=class_data.description,
        teacher_id=teacher.id,
        access_code=generate_unique_code(db)
    )
    
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)