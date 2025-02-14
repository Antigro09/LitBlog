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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
        return new_user
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
def login_user(login: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == login.email).first()
    if not db_user or not verify_password(login.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "role": db_user.role
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
    
    if role_data["role"] == "student" and "classCode" in role_data:
        class_ = db.query(models.Class).filter(models.Class.access_code == role_data["classCode"]).first()
        if class_:
            enrollment = models.ClassEnrollment(student_id=user.id, class_id=class_.id)
            db.add(enrollment)
    
    db.commit()
    return {"message": "Role updated successfully"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
