from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import math
from database import get_db
import models
import schemas
from auth import get_password_hash, require_admin, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])



@router.get("/", response_model=schemas.PaginatedResponse[schemas.UserResponse])
async def get_users(
    page: int = 1,
    size: int = 20,
    branch_id: Optional[int] = Query(None, description="Filter by branch"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Get all users (Admin only) with pagination"""
    query = db.query(models.User)
    
    if branch_id:
        query = query.filter(models.User.branch_id == branch_id)
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * size
    users = query.offset(skip).limit(size).all()
    
    items = []
    for user in users:
        user_dict = user.__dict__.copy()
        user_dict['branch_name'] = user.branch.branch_name if user.branch else None
        user_dict['department_name'] = user.department.department_name if user.department else None
        items.append(schemas.UserResponse(**user_dict))
    
    return schemas.PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size)
    )


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current logged-in user details"""
    user_dict = current_user.__dict__.copy()
    user_dict['branch_name'] = current_user.branch.branch_name if current_user.branch else None
    user_dict['department_name'] = current_user.department.department_name if current_user.department else None
    return schemas.UserResponse(**user_dict)


@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Get user by ID (Admin only)"""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Create new user (Admin only)"""
    # Check if username exists
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Generate Auto ID: USR-YYYY-MM-DD-XXX
    now = datetime.now()
    prefix = f"USR-{now.year}-{now.month:02d}-{now.day:02d}-"
    
    # Find last code with this prefix (Daily Sequence)
    last_user = db.query(models.User)\
        .filter(models.User.user_code.like(f"{prefix}%"))\
        .order_by(models.User.user_code.desc())\
        .first()
        
    next_seq = 1
    if last_user and last_user.user_code:
        try:
            current_seq_str = last_user.user_code.split('-')[-1]
            next_seq = int(current_seq_str) + 1
        except (ValueError, IndexError):
            pass
            
    user_code = f"{prefix}{next_seq:03d}"

    db_user = models.User(
        username=user.username,
        password_hash=get_password_hash(user.password),
        full_name=user.full_name,
        role=user.role.value,
        branch_id=user.branch_id,
        department_id=user.department_id,
        user_code=user_code
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Update user (Admin only)"""
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.model_dump(exclude_unset=True)
    if "role" in update_data:
        update_data["role"] = update_data["role"].value
    if "status" in update_data:
        update_data["status"] = update_data["status"].value
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Deactivate user (Admin only) - soft delete"""
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    db_user.status = "inactive"
    db.commit()
    return None


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Reset user password (Admin only)"""
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"message": "Password reset successfully"}
