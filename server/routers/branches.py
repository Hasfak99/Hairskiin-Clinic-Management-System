from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas
from auth import require_admin, require_admin_or_manager, require_any_role

router = APIRouter(prefix="/branches", tags=["Branches"])


@router.get("/", response_model=List[schemas.BranchResponse])
async def get_branches(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = Query(False, description="Filter only active branches"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get all branches"""
    query = db.query(models.Branch)
    
    if active_only:
        query = query.filter(models.Branch.is_active == True)
    
    branches = query.order_by(models.Branch.branch_name).offset(skip).limit(limit).all()
    
    # Populate department_name
    items = []
    for b in branches:
        b_dict = b.__dict__.copy()
        b_dict['department_name'] = b.department.department_name if b.department else None
        items.append(schemas.BranchResponse(**b_dict))
        
    return items


@router.get("/{branch_id}", response_model=schemas.BranchResponse)
async def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Get branch by ID"""
    branch = db.query(models.Branch).filter(models.Branch.branch_id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    b_dict = branch.__dict__.copy()
    b_dict['department_name'] = branch.department.department_name if branch.department else None
    
    return schemas.BranchResponse(**b_dict)


@router.post("/", response_model=schemas.BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch(
    branch: schemas.BranchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Create new branch"""
    # Validate department
    department = db.query(models.Department).filter(models.Department.department_id == branch.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    db_branch = models.Branch(**branch.model_dump())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    
    b_dict = db_branch.__dict__.copy()
    b_dict['department_name'] = department.department_name
    
    return schemas.BranchResponse(**b_dict)


@router.put("/{branch_id}", response_model=schemas.BranchResponse)
async def update_branch(
    branch_id: int,
    branch_update: schemas.BranchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Update branch"""
    db_branch = db.query(models.Branch).filter(models.Branch.branch_id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    update_data = branch_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_branch, key, value)
    
    db.commit()
    db.refresh(db_branch)
    
    b_dict = db_branch.__dict__.copy()
    b_dict['department_name'] = db_branch.department.department_name if db_branch.department else None
    
    return schemas.BranchResponse(**b_dict)


@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Delete branch (soft delete by setting is_active=False)"""
    db_branch = db.query(models.Branch).filter(models.Branch.branch_id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check for related records
    has_clients = db.query(models.Client).filter(models.Client.branch_id == branch_id).first()
    if has_clients:
        # Soft delete instead
        db_branch.is_active = False
        db.commit()
    else:
        db.delete(db_branch)
        db.commit()
    
    return None
