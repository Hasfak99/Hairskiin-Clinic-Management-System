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
    
    # Filter by Branch Logic
    # 1. If explicit branch_id query param is provided, use it.
    # 2. If not, use current_user.branch_id, UNLESS user is allowed to see all branches.
    
    can_see_all_branches = False
    
    # 1. Super Admin and Director can always see all branches
    if current_user.role in [models.UserRole.super_admin, models.UserRole.director]:
        can_see_all_branches = True
        
    # 2. Main Branch Admin can see all branches (BUT NOT Managers)
    elif current_user.role == models.UserRole.admin and current_user.branch_id:
        # Explicit query to check branch name safely
        try:
            branch = db.query(models.Branch).filter(models.Branch.branch_id == current_user.branch_id).first()
            if branch and branch.branch_name == 'Main Branch':
                can_see_all_branches = True
        except Exception:
            # Fallback if query fails
            pass
    
    target_branch_id = branch_id
    
    if target_branch_id is None:
        # No explicit filter. Enforce user's branch unless they can see all.
        if current_user.branch_id and not can_see_all_branches:
            target_branch_id = current_user.branch_id

    # Apply Branch Filter
    if target_branch_id is not None:
        query = query.filter(
            (models.Treatment.branch_id == target_branch_id) | 
            (models.Treatment.branch_id.is_(None))
        )
        
    # Filter by Department (for non-super-admins)
    if current_user.role != models.UserRole.super_admin and current_user.department_id:
        query = query.filter(models.Treatment.department_id == current_user.department_id)
    
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
    
    items = []
    for t in treatments:
        t_dict = t.__dict__.copy()
        t_dict['branch_name'] = t.branch.branch_name if t.branch else None
        t_dict['department_name'] = t.department.department_name if t.department else None
        items.append(schemas.TreatmentResponse(**t_dict))

    return schemas.PaginatedResponse(
        items=items,
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


@router.post("/record", status_code=status.HTTP_201_CREATED)
async def record_treatment(
    data: schemas.RecordTreatmentRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Record a completed treatment with products"""
    # 1. Validate Client
    client = db.query(models.Client).filter(models.Client.client_id == data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # 2. Validate Treatment
    treatment = db.query(models.Treatment).filter(models.Treatment.treatment_id == data.treatment_id).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")

    # 3. Handle Appointment (Update Existing or Create New)
    appointment = None
    
    # Determine Stylist ID logic (applies to both cases)
    stylist_id = data.stylist_id
    if not stylist_id and current_user.role == models.UserRole.doctor:
        stylist_id = current_user.user_id

    if data.appointment_id:
        # Update existing appointment
        appointment = db.query(models.Appointment).filter(models.Appointment.appointment_id == data.appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Verify it belongs to the client
        if appointment.client_id != data.client_id:
            raise HTTPException(status_code=400, detail="Appointment does not belong to this client")
            
        appointment.status = "completed"
        # Update details if changed
        appointment.treatment_id = data.treatment_id
        if data.notes:
            appointment.notes = data.notes
        
        # Update stylist if determined
        if stylist_id:
            appointment.stylist_id = stylist_id
        
        db.commit()
        db.refresh(appointment)
    else:
        # Create New Appointment (Completed)
        now_time = datetime.now().time()
        today_date = datetime.now().date()

        appointment = models.Appointment(
            client_id=data.client_id,
            treatment_id=data.treatment_id,
            branch_id=data.branch_id,
            department_id=treatment.department_id,
            appointment_date=today_date,
            appointment_time=now_time,
            status="completed",
            payment_status="pending",
            stylist_id=stylist_id,
            notes=data.notes
        )
        db.add(appointment)
        db.flush() # Get ID

    # 4. Create Bill
    bill = models.Bill(
        client_id=data.client_id,
        appointment_id=appointment.appointment_id,
        branch_id=data.branch_id,
        department_id=treatment.department_id,
        stylist_id=stylist_id,
        payment_status="pending",
        bill_date=datetime.now()
    )
    db.add(bill)
    db.flush()

    total_amount = 0.0

    # 5. Add Treatment to Bill
    treat_detail = models.BillDetail(
        bill_id=bill.bill_id,
        item_type="treatment",
        item_id=treatment.treatment_id,
        item_name=treatment.treatment_name,
        quantity=1,
        unit_price=treatment.price,
        total_price=treatment.price
    )
    db.add(treat_detail)
    total_amount += treatment.price

    # 6. Add Products
    for prod_item in data.products:
        product = db.query(models.Product).filter(models.Product.product_id == prod_item.product_id).first()
        if not product:
            continue 
        
        # Decrement stock (simple implementation, can be refined)
        if product.stock_qty >= prod_item.quantity:
            product.stock_qty -= prod_item.quantity
        
        item_total = product.price * prod_item.quantity
        prod_detail = models.BillDetail(
            bill_id=bill.bill_id,
            item_type="product",
            item_id=product.product_id,
            item_name=product.product_name,
            quantity=prod_item.quantity,
            unit_price=product.price,
            total_price=item_total
        )
        db.add(prod_detail)
        total_amount += item_total

    # Update Bill Totals
    bill.total_amount = total_amount
    bill.final_amount = total_amount # Tax/Discount can be applied later by receptionist

    db.commit()
    db.refresh(appointment)
    db.refresh(bill)

    return {
        "message": "Treatment recorded successfully",
        "appointment_id": appointment.appointment_id,
        "bill_id": bill.bill_id
    }
