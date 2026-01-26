from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from database import get_db
import models
import schemas
from auth import require_any_role, get_branch_id_dependency

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/", response_model=List[schemas.ClientResponse])
async def get_clients(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by name or phone"),
    branch_id: Optional[int] = Query(None, description="Filter by branch"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Get all clients with optional search"""
    query = db.query(models.Client)
    
    # Filter by branch_id - only if provided or user has a branch
    # If user has no branch_id, show all clients
    filter_branch_id = branch_id if branch_id else current_branch_id
    if filter_branch_id is not None:
        # Show clients for this branch OR clients with no branch (global)
        query = query.filter(
            (models.Client.branch_id == filter_branch_id) | 
            (models.Client.branch_id.is_(None))
        )
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Client.name.ilike(search_term),
                models.Client.phone.ilike(search_term),
                models.Client.email.ilike(search_term)
            )
        )
    
    clients = query.order_by(models.Client.name).offset(skip).limit(limit).all()
    result = []
    for client in clients:
        # Build response safely, handling None branch relationships
        branch_name = None
        if client.branch_id and client.branch:
            branch_name = client.branch.branch_name
        
        client_data = {
            'client_id': client.client_id,
            'name': client.name,
            'phone': client.phone,
            'email': client.email,
            'address': client.address,
            'dob': client.dob,
            'notes': client.notes,
            'branch_id': client.branch_id,
            'created_at': client.created_at,
            'updated_at': client.updated_at,
            'branch_name': branch_name
        }
        result.append(schemas.ClientResponse(**client_data))
    return result


@router.get("/lookup/{phone}", response_model=schemas.ClientWithHistory)
async def lookup_client_by_phone(
    phone: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Quick lookup client by phone number with history"""
    client = db.query(models.Client).filter(models.Client.phone.ilike(f"%{phone}%")).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get appointment count
    total_appointments = db.query(func.count(models.Appointment.appointment_id))\
        .filter(models.Appointment.client_id == client.client_id).scalar()
    
    # Get total spent
    total_spent = db.query(func.sum(models.Bill.final_amount))\
        .filter(models.Bill.client_id == client.client_id).scalar() or 0.0
    
    # Get last visit
    last_appointment = db.query(models.Appointment)\
        .filter(models.Appointment.client_id == client.client_id)\
        .filter(models.Appointment.status == "completed")\
        .order_by(models.Appointment.appointment_date.desc())\
        .first()
    
    return schemas.ClientWithHistory(
        **client.__dict__,
        total_appointments=total_appointments,
        total_spent=total_spent,
        last_visit=last_appointment.created_at if last_appointment else None
    )


@router.get("/{client_id}", response_model=schemas.ClientWithHistory)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get client by ID with history"""
    client = db.query(models.Client).filter(models.Client.client_id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    total_appointments = db.query(func.count(models.Appointment.appointment_id))\
        .filter(models.Appointment.client_id == client.client_id).scalar()
    
    total_spent = db.query(func.sum(models.Bill.final_amount))\
        .filter(models.Bill.client_id == client.client_id).scalar() or 0.0
    
    last_appointment = db.query(models.Appointment)\
        .filter(models.Appointment.client_id == client.client_id)\
        .filter(models.Appointment.status == "completed")\
        .order_by(models.Appointment.appointment_date.desc())\
        .first()
    
    return schemas.ClientWithHistory(
        **client.__dict__,
        total_appointments=total_appointments,
        total_spent=total_spent,
        last_visit=last_appointment.created_at if last_appointment else None
    )


@router.post("/", response_model=schemas.ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client: schemas.ClientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Create new client"""
    # Use branch_id from request or user's branch
    # If user has no branch_id, allow None (global client)
    branch_id = client.branch_id if client.branch_id is not None else current_branch_id
    # Allow None branch_id for global clients (admins can create global clients)
    
    # Check if phone exists in same branch
    existing = db.query(models.Client).filter(
        models.Client.phone == client.phone,
        models.Client.branch_id == branch_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered in this branch")
    
    client_data = client.model_dump()
    client_data['branch_id'] = branch_id
    db_client = models.Client(**client_data)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    
    client_dict = db_client.__dict__.copy()
    client_dict['branch_name'] = db_client.branch.branch_name if db_client.branch else None
    return schemas.ClientResponse(**client_dict)


@router.put("/{client_id}", response_model=schemas.ClientResponse)
async def update_client(
    client_id: int,
    client_update: schemas.ClientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Update client"""
    db_client = db.query(models.Client).filter(models.Client.client_id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check phone uniqueness if updating
    if client_update.phone and client_update.phone != db_client.phone:
        existing = db.query(models.Client).filter(models.Client.phone == client_update.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    
    update_data = client_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_client, key, value)
    
    db.commit()
    db.refresh(db_client)
    return db_client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Delete client"""
    db_client = db.query(models.Client).filter(models.Client.client_id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check for related records
    has_appointments = db.query(models.Appointment)\
        .filter(models.Appointment.client_id == client_id).first()
    if has_appointments:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete client with existing appointments. Archive instead."
        )
    
    db.delete(db_client)
    db.commit()
    return None


@router.get("/{client_id}/appointments", response_model=List[schemas.AppointmentResponse])
async def get_client_appointments(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get all appointments for a client"""
    appointments = db.query(models.Appointment)\
        .filter(models.Appointment.client_id == client_id)\
        .order_by(models.Appointment.appointment_date.desc())\
        .all()
    
    result = []
    for apt in appointments:
        apt_dict = apt.__dict__.copy()
        apt_dict['client_name'] = apt.client.name if apt.client else None
        apt_dict['treatment_name'] = apt.treatment.treatment_name if apt.treatment else None
        apt_dict['treatment_price'] = apt.treatment.price if apt.treatment else None
        result.append(schemas.AppointmentResponse(**apt_dict))
    
    return result


@router.get("/{client_id}/bills", response_model=List[schemas.BillResponse])
async def get_client_bills(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get all bills for a client"""
    bills = db.query(models.Bill)\
        .filter(models.Bill.client_id == client_id)\
        .order_by(models.Bill.bill_date.desc())\
        .all()
    
    result = []
    for bill in bills:
        bill_dict = bill.__dict__.copy()
        bill_dict['client_name'] = bill.client.name if bill.client else None
        bill_dict['details'] = [schemas.BillDetailResponse(**d.__dict__) for d in bill.details]
        result.append(schemas.BillResponse(**bill_dict))
    
    return result
