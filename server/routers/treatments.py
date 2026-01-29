from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import math
from database import get_db
import models
import schemas
from auth import require_any_role, require_admin_or_manager, get_branch_id_dependency

router = APIRouter(prefix="/treatments", tags=["Treatments"])



@router.get("/", response_model=schemas.PaginatedResponse[schemas.TreatmentResponse])
async def get_treatments(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = Query(None, description="Search by name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    active_only: bool = Query(True, description="Show only active treatments"),
    branch_id: Optional[int] = Query(None, description="Filter by branch"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Get all treatments with optional filters and pagination"""
    query = db.query(models.Treatment)
    
    # Filter by branch_id - only if provided or user has a branch
    # If user is admin/manager without branch_id, show all treatments
    # If user has branch_id or branch_id is provided, filter by it
    filter_branch_id = branch_id if branch_id else current_branch_id
    if filter_branch_id is not None:
        # Filter by specific branch_id OR treatments with no branch_id (global treatments)
        query = query.filter(
            (models.Treatment.branch_id == filter_branch_id) | 
            (models.Treatment.branch_id.is_(None))
        )
    # If filter_branch_id is None, show all treatments (admin/manager without branch)
    
    if active_only:
        query = query.filter(models.Treatment.is_active == True)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Treatment.treatment_name.ilike(search_term),
                models.Treatment.description.ilike(search_term)
            )
        )
    
    if category:
        query = query.filter(models.Treatment.category == category)
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * size
    treatments = query.order_by(models.Treatment.treatment_name).offset(skip).limit(size).all()
    
    return schemas.PaginatedResponse(
        items=treatments,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size)
    )


@router.get("/categories")
async def get_treatment_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get list of treatment categories"""
    categories = db.query(models.Treatment.category)\
        .filter(models.Treatment.category.isnot(None))\
        .distinct().all()
    return [c[0] for c in categories if c[0]]


@router.get("/{treatment_id}", response_model=schemas.TreatmentResponse)
async def get_treatment(
    treatment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get treatment by ID"""
    treatment = db.query(models.Treatment).filter(models.Treatment.treatment_id == treatment_id).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return treatment


@router.post("/", response_model=schemas.TreatmentResponse, status_code=status.HTTP_201_CREATED)
async def create_treatment(
    treatment: schemas.TreatmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Create new treatment (Admin/Manager only)"""
    # Use branch_id from request or user's branch
    branch_id = treatment.branch_id if treatment.branch_id else current_branch_id
    if not branch_id:
        raise HTTPException(status_code=400, detail="Branch ID is required")
    
    treatment_data = treatment.model_dump()
    treatment_data['branch_id'] = branch_id

    # Generate Auto ID: TRT-YYYY-MM-DD-XXX
    now = datetime.now()
    prefix = f"TRT-{now.year}-{now.month:02d}-{now.day:02d}-"
    
    # Find last code with this prefix (Daily Sequence)
    last_treatment = db.query(models.Treatment)\
        .filter(models.Treatment.treatment_code.like(f"{prefix}%"))\
        .order_by(models.Treatment.treatment_code.desc())\
        .first()
        
    next_seq = 1
    if last_treatment and last_treatment.treatment_code:
        try:
            # Extract sequence number from TRT-YYYY-MM-DD-001
            current_seq_str = last_treatment.treatment_code.split('-')[-1]
            next_seq = int(current_seq_str) + 1
        except (ValueError, IndexError):
            pass
            
    treatment_data['treatment_code'] = f"{prefix}{next_seq:03d}"

    db_treatment = models.Treatment(**treatment_data)
    db.add(db_treatment)
    db.commit()
    db.refresh(db_treatment)
    return db_treatment


@router.put("/{treatment_id}", response_model=schemas.TreatmentResponse)
async def update_treatment(
    treatment_id: int,
    treatment_update: schemas.TreatmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Update treatment (Admin/Manager only)"""
    db_treatment = db.query(models.Treatment).filter(models.Treatment.treatment_id == treatment_id).first()
    if not db_treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    update_data = treatment_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_treatment, key, value)
    
    db.commit()
    db.refresh(db_treatment)
    return db_treatment


@router.delete("/{treatment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_treatment(
    treatment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Deactivate treatment (Admin/Manager only) - soft delete"""
    db_treatment = db.query(models.Treatment).filter(models.Treatment.treatment_id == treatment_id).first()
    if not db_treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Soft delete - just deactivate
    db_treatment.is_active = False
    db.commit()
    return None
