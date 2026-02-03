from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import math
from database import get_db
import models
import schemas
from auth import require_any_role, require_admin_or_manager, get_branch_id_dependency
from utils.email import send_low_stock_notification, send_low_stock_report

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=schemas.PaginatedResponse[schemas.ProductResponse])
async def get_products(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = Query(None, description="Search by name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    active_only: bool = Query(True, description="Show only active products"),
    branch_id: Optional[int] = Query(None, description="Filter by branch"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Get all products with optional filters"""
    query = db.query(models.Product)
    
    # Filter by branch_id - only if provided or user has a branch
    # If user has no branch_id, show all products
    
    # STRICT ISOLATION for non-super-admins
    if current_user.role != models.UserRole.super_admin:
        # Filter by Department
        if current_user.department_id:
            query = query.filter(models.Product.department_id == current_user.department_id)
        
        # Filter by Branch
        if current_user.branch_id:
            query = query.filter(
                (models.Product.branch_id == current_user.branch_id) | 
                (models.Product.branch_id.is_(None))
            )
    else:
        # If Super Admin, allow optional filtering by branch if provided
        if branch_id:
             query = query.filter(
                (models.Product.branch_id == branch_id) | 
                (models.Product.branch_id.is_(None))
            )
    
    if active_only:
        query = query.filter(models.Product.is_active == True)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Product.product_name.ilike(search_term),
                models.Product.description.ilike(search_term)
            )
        )
    
    if category:
        query = query.filter(models.Product.category == category)
    
    if low_stock_only:
        query = query.filter(models.Product.stock_qty <= models.Product.min_stock)
    
    today = datetime.now().date()
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * size
    products = query.order_by(models.Product.product_name).offset(skip).limit(size).all()
    
    items = []
    for p in products:
        p_dict = p.__dict__.copy()
        p_dict['branch_name'] = p.branch.branch_name if p.branch else None
        p_dict['department_name'] = p.department.department_name if p.department else None
        items.append(schemas.ProductResponse(**p_dict))
    
    return schemas.PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size)
    )


@router.get("/categories")
async def get_product_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get list of product categories"""
    categories = db.query(models.Product.category)\
        .filter(models.Product.category.isnot(None))\
        .distinct().all()
    return [c[0] for c in categories if c[0]]


@router.get("/low-stock", response_model=List[schemas.ProductResponse])
async def get_low_stock_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get products with stock below minimum threshold"""
    products = db.query(models.Product)\
        .filter(models.Product.is_active == True)\
        .filter(models.Product.stock_qty <= models.Product.min_stock)\
        .order_by(models.Product.stock_qty)\
        .all()
    return products


@router.get("/{product_id}", response_model=schemas.ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get product by ID"""
    product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    p_dict = product.__dict__.copy()
    p_dict['branch_name'] = product.branch.branch_name if product.branch else None
    p_dict['department_name'] = product.department.department_name if product.department else None
    return schemas.ProductResponse(**p_dict)


@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Create new product (Admin/Manager only)"""
    # Use branch_id from request or user's branch
    branch_id = product.branch_id if product.branch_id else current_branch_id
    if not branch_id:
        raise HTTPException(status_code=400, detail="Branch ID is required")
    
    product_data = product.model_dump()
    product_data['branch_id'] = branch_id

    # Generate Auto ID: PRD-YYYY-MM-DD-XXX
    now = datetime.now()
    prefix = f"PRD-{now.year}-{now.month:02d}-{now.day:02d}-"
    
    # Find last code with this prefix (Daily Sequence)
    last_item = db.query(models.Product)\
        .filter(models.Product.product_code.like(f"{prefix}%"))\
        .order_by(models.Product.product_code.desc())\
        .first()
        
    next_seq = 1
    if last_item and last_item.product_code:
        try:
            current_seq_str = last_item.product_code.split('-')[-1]
            next_seq = int(current_seq_str) + 1
        except (ValueError, IndexError):
            pass
            
    product_data['product_code'] = f"{prefix}{next_seq:03d}"
    db_product = models.Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    p_dict = db_product.__dict__.copy()
    p_dict['branch_name'] = db_product.branch.branch_name if db_product.branch else None
    p_dict['department_name'] = db_product.department.department_name if db_product.department else None
    return schemas.ProductResponse(**p_dict)


@router.put("/{product_id}", response_model=schemas.ProductResponse)
async def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Update product (Admin/Manager only)"""
    db_product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    # Check for stock drop
    if "stock_qty" in update_data:
        old_qty = db_product.stock_qty
        new_qty = update_data["stock_qty"]
        if old_qty >= 50 and new_qty < 50:
            background_tasks.add_task(send_low_stock_notification, db_product.product_name, new_qty, 50)

    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    
    p_dict = db_product.__dict__.copy()
    p_dict['branch_name'] = db_product.branch.branch_name if db_product.branch else None
    p_dict['department_name'] = db_product.department.department_name if db_product.department else None
    return schemas.ProductResponse(**p_dict)


@router.patch("/{product_id}/stock")
async def update_stock(
    product_id: int,
    background_tasks: BackgroundTasks,
    quantity: int = Query(..., description="Quantity to add (positive) or remove (negative)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Update product stock quantity"""
    db_product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_qty = db_product.stock_qty + quantity
    
    if db_product.stock_qty >= 50 and new_qty < 50:
        background_tasks.add_task(send_low_stock_notification, db_product.product_name, new_qty, 50)

    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    db_product.stock_qty = new_qty
    db.commit()
    
    return {
        "product_id": product_id,
        "previous_stock": db_product.stock_qty - quantity,
        "new_stock": new_qty
    }


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Deactivate product (Admin/Manager only) - soft delete"""
    db_product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.is_active = False
    db.commit()
    return None


@router.post("/low-stock/notify")
async def notify_low_stock(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Trigger email report for all low stock products (< 50)"""
    # Find all products with stock < 50
    products = db.query(models.Product)\
        .filter(models.Product.is_active == True)\
        .filter(models.Product.stock_qty < 50)\
        .all()
    
    if not products:
        return {"message": "No low stock products found", "count": 0}
    
    product_list = [{"name": p.product_name, "stock": p.stock_qty} for p in products]
    
    background_tasks.add_task(send_low_stock_report, product_list)
    
    return {"message": "Low stock report queued for sending", "count": len(products)}
