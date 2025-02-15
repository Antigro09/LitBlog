# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, get_db, Base
import models, schemas
from typing import List
from pydantic import BaseModel
from passlib.context import CryptContext
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
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
    print(f"Starting registration for user with role: {user.role}")  # Debug print
    
    # Check if email or username already exists
    db_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

    # Verify access codes based on role
    class_ = None
    if user.role == models.UserRole.STUDENT:
        print(f"Checking class code: {user.access_code}")  # Debug print
        class_ = db.query(models.Class).filter(
            models.Class.access_code == user.access_code
        ).first()
        print(f"Found class: {class_}")  # Debug print
        print(f"Class details: id={getattr(class_, 'id', None)}, name={getattr(class_, 'name', None)}")  # Debug print
        
        if not class_:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid class code"
            )
    elif user.role == models.UserRole.TEACHER:
        if user.access_code != os.getenv("TEACHER_CODE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid teacher code"
            )
    elif user.role == models.UserRole.ADMIN:
        if user.access_code != os.getenv("ADMIN_CODE"):
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
        print(f"Created user with ID: {new_user.id}")  # Debug print

        # Create class enrollment for students
        class_info = None
        if user.role == models.UserRole.STUDENT and class_:
            print(f"Attempting to create enrollment: student={new_user.id}, class={class_.id}")  # Debug print
            
            enrollment = models.ClassEnrollment(
                student_id=new_user.id,
                class_id=class_.id
            )
            db.add(enrollment)
            db.flush()
            
            # Verify enrollment
            check = db.query(models.ClassEnrollment).filter_by(
                student_id=new_user.id,
                class_id=class_.id
            ).first()
            print(f"Enrollment verification: {check is not None}")  # Debug print

            class_info = {
                "id": class_.id,
                "name": class_.name,
                "access_code": class_.access_code
            }

        # Commit all changes
        db.commit()
        print("Database changes committed successfully")  # Debug print

        # Create access token
        access_token = create_access_token(data={"sub": str(new_user.id)})
        
        response_data = {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "role": new_user.role.value,  # Make sure this is the string value
            "is_admin": new_user.is_admin,
            "created_at": new_user.created_at,
            "token": access_token,
            "class_info": class_info
        }
        print(f"Response data: {response_data}")  # Debug print
        return response_data

    except Exception as e:
        db.rollback()
        print(f"Error in registration: {str(e)}")  # Debug print
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

@app.get("/api/classes/{class_id}")
async def get_class_details(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    class_ = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return {
        "id": class_.id,
        "name": class_.name,
        "access_code": class_.access_code,
        "description": class_.description
    }

@app.get("/api/classes/{class_id}/posts")
async def get_class_posts(
    class_id: int,
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
    
    posts = db.query(models.Blog).filter(
        models.Blog.class_id == class_id
    ).order_by(models.Blog.created_at.desc()).all()
    
    return posts

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
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
