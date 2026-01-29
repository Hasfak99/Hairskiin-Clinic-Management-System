from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from database import engine, get_db, Base
import models
import schemas
from auth import (
    authenticate_user, 
    create_access_token, 
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Import routers
from routers import users, clients, treatments, products, appointments, bills, analytics, search, branches, departments

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate clients table
try:
    from migrate_clients_department import add_department_id_to_clients
    add_department_id_to_clients()
except Exception as e:
    print(f"Migration error: {e}")

# Auto-seed departments
try:
    from seed_departments import seed_departments
    seed_departments()
except Exception as e:
    print(f"Seeding error: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Hairskiin CRM",
    description="Complete Client, Appointment & Billing Management System for Hair & Skin Clinics",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== AUTH ENDPOINTS ====================
@app.post("/api/auth/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Prepare token data - handle None branch_id
    token_data = {
        "sub": user.username,
        "role": user.role
    }
    if user.branch_id is not None:
        token_data["branch_id"] = user.branch_id
    
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_first_admin(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Register first admin user (only works if no users exist)"""
    # Check if any users exist
    existing_users = db.query(models.User).first()
    if existing_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration closed. Please contact admin."
        )
    
    # Create first admin
    db_user = models.User(
        username=user.username,
        password_hash=get_password_hash(user.password),
        full_name=user.full_name,
        role="admin",
        status="active"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


# ==================== INCLUDE ROUTERS ====================
app.include_router(branches.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(treatments.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(bills.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(search.router, prefix="/api")


# ==================== HEALTH CHECK ====================
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "app": "Hairskiin CRM", "version": "1.0.0"}


# ==================== ROOT ====================
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Hairskiin CRM API",
        "docs": "/api/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
