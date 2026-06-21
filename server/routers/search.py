from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from database import get_db
import models
import schemas
from auth import require_any_role

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("/", response_model=List[schemas.SearchResult])
async def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Global search across clients, treatments, products, and appointments"""
    results = []
    search_term = f"%{q}%"
    
    # Search clients
    clients = db.query(models.Client).filter(
        or_(
            models.Client.name.ilike(search_term),
            models.Client.phone.ilike(search_term),
            models.Client.email.ilike(search_term)
        )
    ).limit(5).all()
    
    for c in clients:
        results.append(schemas.SearchResult(
            type="client",
            id=c.client_id,
            title=c.name,
            subtitle=c.phone,
            url=f"/clients/{c.client_id}"
        ))
    
    # Search treatments
    treatments = db.query(models.Treatment).filter(
        or_(
            models.Treatment.treatment_name.ilike(search_term),
            models.Treatment.category.ilike(search_term)
        )
    ).filter(models.Treatment.is_active == True).limit(5).all()
    
    for t in treatments:
        results.append(schemas.SearchResult(
            type="treatment",
            id=t.treatment_id,
            title=t.treatment_name,
            subtitle=f"₹{t.price} • {t.duration} mins",
            url=f"/treatments/{t.treatment_id}"
        ))
    
    # Search products
    products = db.query(models.Product).filter(
        or_(
            models.Product.product_name.ilike(search_term),
            models.Product.category.ilike(search_term)
        )
    ).filter(models.Product.is_active == True).limit(5).all()
    
    for p in products:
        results.append(schemas.SearchResult(
            type="product",
            id=p.product_id,
            title=p.product_name,
            subtitle=f"₹{p.price} • Stock: {p.stock_qty}",
            url=f"/products/{p.product_id}"
        ))
    
    return results


@router.get("/quick")
async def quick_search(
    q: str = Query(..., min_length=1, description="Quick search query"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Quick search for autocomplete - returns minimal data"""
    results = []
    search_term = f"%{q}%"
    
    # Quick client search (primarily by phone)
    clients = db.query(models.Client.client_id, models.Client.name, models.Client.phone).filter(
        or_(
            models.Client.phone.ilike(search_term),
            models.Client.name.ilike(search_term)
        )
    ).limit(5).all()
    
    for c in clients:
        results.append({
            "type": "client",
            "id": c.client_id,
            "label": f"{c.name} ({c.phone})",
            "value": c.client_id
        })
    
    # Quick treatment search
    treatments = db.query(models.Treatment.treatment_id, models.Treatment.treatment_name, models.Treatment.price).filter(
        models.Treatment.treatment_name.ilike(search_term),
        models.Treatment.is_active == True
    ).limit(5).all()
    
    for t in treatments:
        results.append({
            "type": "treatment",
            "id": t.treatment_id,
            "label": f"{t.treatment_name} (₹{t.price})",
            "value": t.treatment_id,
            "price": t.price
        })
    
    return results
