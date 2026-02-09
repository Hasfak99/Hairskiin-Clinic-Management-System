from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import math
from database import get_db
import models
import schemas
from auth import require_any_role
from utils.email import send_low_stock_notification

router = APIRouter(prefix="/bills", tags=["Bills"])



@router.get("/", response_model=schemas.PaginatedResponse[schemas.BillResponse])
async def get_bills(
    page: int = 1,
    size: int = 20,
    client_id: Optional[int] = Query(None, description="Filter by client"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    edit_request_status: Optional[str] = Query(None, description="Filter by edit request status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get all bills with optional filters and pagination"""
    query = db.query(models.Bill)
    
    if client_id:
        query = query.filter(models.Bill.client_id == client_id)
    
    if payment_status:
        query = query.filter(models.Bill.payment_status == payment_status)

    if edit_request_status:
        query = query.filter(models.Bill.edit_request_status == edit_request_status)

    # STRICT ISOLATION for non-super-admins
    if current_user.role != models.UserRole.super_admin:
        # 1. Department Isolation: ALWAYS enforce if set
        if current_user.department_id:
            query = query.filter(models.Bill.department_id == current_user.department_id)
            
        # 2. Branch Isolation:
    # Enforce if user has branch_id AND IS NOT A DIRECTOR AND NOT Main Branch Admin
    is_main_branch = current_user.branch and current_user.branch.branch_name == 'Main Branch'
    if current_user.branch_id and current_user.role != models.UserRole.director and not is_main_branch:
        query = query.filter(models.Bill.branch_id == current_user.branch_id)
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * size
    bills = query.order_by(models.Bill.bill_date.desc()).offset(skip).limit(size).all()
    
    items = []
    for bill in bills:
        bill_dict = bill.__dict__.copy()
        bill_dict['client_name'] = bill.client.name if bill.client else None
        bill_dict['details'] = [schemas.BillDetailResponse(**d.__dict__) for d in bill.details]
        bill_dict['department_name'] = bill.department.department_name if bill.department else None
        bill_dict['branch_name'] = bill.branch.branch_name if bill.branch else None
        bill_dict['edit_request_status'] = bill.edit_request_status  # Explicit access
        items.append(schemas.BillResponse(**bill_dict))
    
    return schemas.PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size)
    )


@router.get("/recent")
async def get_recent_bills(
    limit: int = Query(10, description="Number of recent bills"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get recent bills for quick access"""
    bills = db.query(models.Bill)\
        .order_by(models.Bill.bill_date.desc())\
        .limit(limit)\
        .all()
    
    result = []
    for bill in bills:
        result.append({
            "bill_id": bill.bill_id,
            "client_name": bill.client.name if bill.client else None,
            "total_amount": bill.final_amount,
            "payment_status": bill.payment_status,
            "bill_date": bill.bill_date
        })
    
    return result


@router.get("/{bill_id}", response_model=schemas.BillResponse)
async def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get bill by ID with full details"""
    bill = db.query(models.Bill).filter(models.Bill.bill_id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    bill_dict = bill.__dict__.copy()
    bill_dict['client_name'] = bill.client.name if bill.client else None
    bill_dict['details'] = [schemas.BillDetailResponse(**d.__dict__) for d in bill.details]
    bill_dict['department_name'] = bill.department.department_name if bill.department else None
    bill_dict['branch_name'] = bill.branch.branch_name if bill.branch else None
    bill_dict['edit_request_status'] = bill.edit_request_status  # Explicit access
    
    return schemas.BillResponse(**bill_dict)


@router.post("/", response_model=schemas.BillResponse, status_code=status.HTTP_201_CREATED)
async def create_bill(
    bill: schemas.BillCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Create new bill with items"""
    # Validate client
    client = db.query(models.Client).filter(models.Client.client_id == bill.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate totals
    total_amount = 0.0
    bill_details = []
    
    for item in bill.items:
        total_price = item.unit_price * item.quantity
        total_amount += total_price
        
        # If product, check and reduce stock
        if item.item_type == schemas.ItemType.product:
            product = db.query(models.Product).filter(models.Product.product_id == item.item_id).first()
            if product:
                if product.stock_qty < item.quantity:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for {product.product_name}"
                    )
                
                # Check for low stock alert (new_stock < 50)
                new_stock = product.stock_qty - item.quantity
                if product.stock_qty >= 50 and new_stock < 50:
                    background_tasks.add_task(send_low_stock_notification, product.product_name, new_stock, 50)
                
                product.stock_qty -= item.quantity
        
        bill_details.append(models.BillDetail(
            item_type=item.item_type.value,
            item_id=item.item_id,
            item_name=item.item_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=total_price
        ))
    
    # Calculate final amount
    final_amount = total_amount - bill.discount + bill.tax
    
    # Create bill
    db_bill = models.Bill(
        client_id=bill.client_id,
        appointment_id=bill.appointment_id,
        branch_id=bill.branch_id,
        department_id=bill.department_id,
        total_amount=total_amount,
        discount=bill.discount,
        tax=bill.tax,
        final_amount=final_amount,
        payment_method=bill.payment_method,
        notes=bill.notes
    )
    db.add(db_bill)
    db.flush()  # Get bill_id
    
    # Add details
    for detail in bill_details:
        detail.bill_id = db_bill.bill_id
        db.add(detail)
    
    db.commit()
    db.refresh(db_bill)
    
    # Build response
    bill_dict = db_bill.__dict__.copy()
    bill_dict['client_name'] = client.name
    bill_dict['details'] = [schemas.BillDetailResponse(**d.__dict__) for d in db_bill.details]
    bill_dict['department_name'] = db_bill.department.department_name if db_bill.department else None
    bill_dict['branch_name'] = db_bill.branch.branch_name if db_bill.branch else None
    
    return schemas.BillResponse(**bill_dict)


@router.put("/{bill_id}", response_model=schemas.BillResponse)
async def update_bill(
    bill_id: int,
    bill_update: schemas.BillUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Update bill (discount, tax, payment info)"""
    db_bill = db.query(models.Bill).filter(models.Bill.bill_id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Restriction: If paid and not approved, block (unless just updating notes/payment status? For now block all)
    # Exception: allow updating payment status via this route if needed, but usually that's a separate patch.
    # We'll strict block for now to be safe.
    if db_bill.payment_status == 'paid' and db_bill.edit_request_status != 'approved':
         # Allow updating ONLY notes maybe? For now strict block.
         raise HTTPException(status_code=403, detail="Bill is paid. Request approval to edit.")
    
    update_data = bill_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_bill, key, value)
    
    # Recalculate final amount if discount or tax changed
    if "discount" in update_data or "tax" in update_data:
        db_bill.final_amount = db_bill.total_amount - db_bill.discount + db_bill.tax
    
    db.commit()
    db.refresh(db_bill)
    
    bill_dict = db_bill.__dict__.copy()
    bill_dict['client_name'] = db_bill.client.name if db_bill.client else None
    bill_dict['details'] = [schemas.BillDetailResponse(**d.__dict__) for d in db_bill.details]
    bill_dict['department_name'] = db_bill.department.department_name if db_bill.department else None
    bill_dict['branch_name'] = db_bill.branch.branch_name if db_bill.branch else None
    
    return schemas.BillResponse(**bill_dict)


@router.patch("/{bill_id}/payment")
async def update_payment_status(
    bill_id: int,
    payment_status: str = Query(..., description="Payment status: pending, paid, partial, cancelled"),
    payment_method: Optional[str] = Query(None, description="Payment method"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Quick update payment status"""
    db_bill = db.query(models.Bill).filter(models.Bill.bill_id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    db_bill.payment_status = payment_status
    if payment_method:
        db_bill.payment_method = payment_method
    
    db.commit()
    
    return {
        "bill_id": bill_id,
        "payment_status": payment_status,
        "payment_method": payment_method
    }


@router.post("/{bill_id}/request-edit")
async def request_bill_edit(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Request permission to edit a paid bill"""
    db_bill = db.query(models.Bill).filter(models.Bill.bill_id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if db_bill.payment_status != 'paid':
        raise HTTPException(status_code=400, detail="Only paid bills need edit approval")
        
    db_bill.edit_request_status = "pending"
    db.commit()
    return {"message": "Edit request sent", "status": "pending"}


@router.post("/{bill_id}/approve-edit")
async def approve_bill_edit(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Approve edit request for a bill"""
    if current_user.role not in ['manager', 'director', 'super_admin']:
         raise HTTPException(status_code=403, detail="Only managers/directors can approve edits")

    db_bill = db.query(models.Bill).filter(models.Bill.bill_id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    db_bill.edit_request_status = "approved"
    db.commit()
    return {"message": "Edit request approved", "status": "approved"}


@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Cancel/delete bill"""
    db_bill = db.query(models.Bill).filter(models.Bill.bill_id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Restore product stock
    for detail in db_bill.details:
        if detail.item_type == "product":
            product = db.query(models.Product).filter(models.Product.product_id == detail.item_id).first()
            if product:
                product.stock_qty += detail.quantity
    
    # Delete bill and details
    db.delete(db_bill)
    db.commit()
    return None


@router.post("/{bill_id}/items", response_model=schemas.BillDetailResponse)
async def add_bill_item(
    bill_id: int,
    item: schemas.BillDetailCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Add item to existing bill"""
    db_bill = db.query(models.Bill).filter(models.Bill.bill_id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Restriction: If paid and not approved, block
    if db_bill.payment_status == 'paid' and db_bill.edit_request_status != 'approved':
         raise HTTPException(status_code=403, detail="Bill is paid. Request approval to edit.")
    
    total_price = item.unit_price * item.quantity
    
    # If product, reduce stock
    if item.item_type == schemas.ItemType.product:
        product = db.query(models.Product).filter(models.Product.product_id == item.item_id).first()
        if product:
            if product.stock_qty < item.quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock")
            
            # Check for low stock alert
            new_stock = product.stock_qty - item.quantity
            if product.stock_qty >= 50 and new_stock < 50:
                background_tasks.add_task(send_low_stock_notification, product.product_name, new_stock, 50)
                
            product.stock_qty -= item.quantity
    
    detail = models.BillDetail(
        bill_id=bill_id,
        item_type=item.item_type.value,
        item_id=item.item_id,
        item_name=item.item_name,
        quantity=item.quantity,
        unit_price=item.unit_price,
        total_price=total_price
    )
    db.add(detail)
    
    # Update bill total
    db_bill.total_amount += total_price
    db_bill.final_amount = db_bill.total_amount - db_bill.discount + db_bill.tax
    
    db.commit()
    db.refresh(detail)
    
    return schemas.BillDetailResponse(**detail.__dict__)


@router.delete("/{bill_id}/items/{detail_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bill_item(
    bill_id: int,
    detail_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Remove item from bill"""
    db_bill = db.query(models.Bill).filter(models.Bill.bill_id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Restriction: If paid and not approved, block
    if db_bill.payment_status == 'paid' and db_bill.edit_request_status != 'approved':
         raise HTTPException(status_code=403, detail="Bill is paid. Request approval to edit.")
    
    # prevent modification if paid (optional, but good practice, though user might want to fix mistakes)
    # if db_bill.payment_status == 'paid':
    #     raise HTTPException(status_code=400, detail="Cannot modify paid bill")
    
    detail = db.query(models.BillDetail).filter(
        models.BillDetail.bill_id == bill_id,
        models.BillDetail.bill_detail_id == detail_id
    ).first()
    
    if not detail:
        raise HTTPException(status_code=404, detail="Item not found in bill")
    
    # Restore stock if product
    if detail.item_type == "product":
        product = db.query(models.Product).filter(models.Product.product_id == detail.item_id).first()
        if product:
            product.stock_qty += detail.quantity
            
    # Update totals
    print(f"Removing item worth: {detail.total_price}. Old total: {db_bill.total_amount}")
    db_bill.total_amount -= detail.total_price
    
    # Ensure total doesn't go negative due to float precision
    if db_bill.total_amount < 0:
        db_bill.total_amount = 0
        
    db_bill.final_amount = db_bill.total_amount - db_bill.discount + db_bill.tax
    
    db.delete(detail)
    db.commit()
    
    return None
