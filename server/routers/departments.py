from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas
from auth import require_admin_or_manager, get_current_user

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/", response_model=List[schemas.DepartmentResponse])
async def get_departments(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = Query(True, description="Filter active departments only"),
    branch_id: Optional[int] = Query(None, description="Filter by branch"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all departments"""
    query = db.query(models.Department)
    
    if active_only:
        query = query.filter(models.Department.is_active == True)
    
    if branch_id:
        # Show specific branch departments AND global departments
        query = query.filter((models.Department.branch_id == branch_id) | (models.Department.branch_id == None))
    
    departments = query.offset(skip).limit(limit).all()
    result = []
    for dept in departments:
        dept_dict = dept.__dict__.copy()
        dept_dict['branch_name'] = dept.branch.branch_name if dept.branch else None
        result.append(schemas.DepartmentResponse(**dept_dict))
    return result


@router.get("/{department_id}", response_model=schemas.DepartmentResponse)
async def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get department by ID"""
    dept = db.query(models.Department).filter(models.Department.department_id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept_dict = dept.__dict__.copy()
    dept_dict['branch_name'] = dept.branch.branch_name if dept.branch else None
    return schemas.DepartmentResponse(**dept_dict)


@router.post("/", response_model=schemas.DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    department: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Create new department (Admin/Manager only)"""
    db_dept = models.Department(
        department_name=department.department_name,
        description=department.description,
        branch_id=department.branch_id
    )
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    
    dept_dict = db_dept.__dict__.copy()
    dept_dict['branch_name'] = db_dept.branch.branch_name if db_dept.branch else None
    return schemas.DepartmentResponse(**dept_dict)


@router.put("/{department_id}", response_model=schemas.DepartmentResponse)
async def update_department(
    department_id: int,
    department_update: schemas.DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Update department (Admin/Manager only)"""
    db_dept = db.query(models.Department).filter(models.Department.department_id == department_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = department_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_dept, key, value)
    
    db.commit()
    db.refresh(db_dept)
    
    dept_dict = db_dept.__dict__.copy()
    dept_dict['branch_name'] = db_dept.branch.branch_name if db_dept.branch else None
    return schemas.DepartmentResponse(**dept_dict)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Deactivate department (Admin/Manager only) - soft delete"""
    db_dept = db.query(models.Department).filter(models.Department.department_id == department_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db_dept.is_active = False
    db.commit()
    return None
