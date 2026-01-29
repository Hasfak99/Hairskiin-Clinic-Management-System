from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import uuid
from datetime import datetime
import math
from database import get_db
import models
import schemas
from auth import require_any_role

router = APIRouter(prefix="/clients", tags=["Clients"])



@router.get("/", response_model=schemas.PaginatedResponse[schemas.ClientResponse])
async def get_clients(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = Query(None, description="Search by name or phone"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get all clients with optional search and pagination"""
    query = db.query(models.Client)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Client.name.ilike(search_term),
                models.Client.phone.ilike(search_term),
                models.Client.email.ilike(search_term)
            )
        )
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * size
    clients = query.order_by(models.Client.name).offset(skip).limit(size).all()
    
    items = []
    for client in clients:
        client_dict = client.__dict__.copy()
        client_dict['branch_name'] = client.branch.branch_name if client.branch else None
        client_dict['department_name'] = client.department.department_name if client.department else None
        items.append(schemas.ClientResponse(**client_dict))
    
    return schemas.PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size)
    )


@router.get("/lookup/{phone}", response_model=schemas.ClientWithHistory)
async def lookup_client_by_phone(
    phone: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Quick lookup client by phone number with complete history - FOR RECEPTIONISTS"""
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
    
    # Get all treatments done (complete history)
    appointments = db.query(models.Appointment)\
        .filter(models.Appointment.client_id == client.client_id)\
        .order_by(models.Appointment.appointment_date.desc())\
        .all()
    
    treatments_done = []
    for apt in appointments:
        treatment_name = apt.treatment.treatment_name if apt.treatment else "Unknown"
        amount = apt.treatment.price if apt.treatment else 0.0
        
        treatments_done.append(schemas.TreatmentHistoryItem(
            appointment_id=apt.appointment_id,
            treatment_name=treatment_name,
            appointment_date=apt.appointment_date,
            appointment_time=apt.appointment_time,
            status=apt.status,
            payment_status=apt.payment_status if hasattr(apt, 'payment_status') else None,
            amount=amount
        ))
    
    return schemas.ClientWithHistory(
        **client.__dict__,
        branch_name=client.branch.branch_name if client.branch else None,
        department_name=client.department.department_name if client.department else None,
        total_appointments=total_appointments,
        total_spent=total_spent,
        last_visit=last_appointment.created_at if last_appointment else None,
        treatments_done=treatments_done
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
        branch_name=client.branch.branch_name if client.branch else None,
        department_name=client.department.department_name if client.department else None,
        total_appointments=total_appointments,
        total_spent=total_spent,
        last_visit=last_appointment.created_at if last_appointment else None
    )


@router.post("/", response_model=schemas.ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client: schemas.ClientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Create new client"""
    # Check if phone exists
    existing = db.query(models.Client).filter(models.Client.phone == client.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    db_client_data = client.model_dump()
    
    # Generate Auto ID: CLT-YYYY-MM-DD-XXX
    now = datetime.now()
    prefix = f"CLT-{now.year}-{now.month:02d}-{now.day:02d}-"
    
    # Find last code with this prefix (Daily Sequence)
    last_item = db.query(models.Client)\
        .filter(models.Client.client_code.like(f"{prefix}%"))\
        .order_by(models.Client.client_code.desc())\
        .first()
        
    next_seq = 1
    if last_item and last_item.client_code:
        try:
            current_seq_str = last_item.client_code.split('-')[-1]
            next_seq = int(current_seq_str) + 1
        except (ValueError, IndexError):
            pass
            
    db_client_data['client_code'] = f"{prefix}{next_seq:03d}"
    
    # Auto-assign department if user belongs to one
    if current_user.department_id:
        db_client_data['department_id'] = current_user.department_id

    db_client = models.Client(**db_client_data)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    
    # Manually populate department_name for response
    client_dict = db_client.__dict__.copy()
    client_dict['branch_name'] = db_client.branch.branch_name if db_client.branch else None
    client_dict['department_name'] = db_client.department.department_name if db_client.department else None
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
    
    # Manually populate department_name
    client_dict = db_client.__dict__.copy()
    client_dict['branch_name'] = db_client.branch.branch_name if db_client.branch else None
    client_dict['department_name'] = db_client.department.department_name if db_client.department else None
    return schemas.ClientResponse(**client_dict)


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


# ==================== QR CODE ENDPOINTS ====================
@router.post("/{client_id}/generate-qr", response_model=schemas.QRCodeResponse)
async def generate_client_qr(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Generate or regenerate QR code for client"""
    client = db.query(models.Client).filter(models.Client.client_id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Generate unique QR code
    qr_id = str(uuid.uuid4())[:8].upper()
    
    # Ensure uniqueness
    while db.query(models.Client).filter(models.Client.qr_code == qr_id).first():
        qr_id = str(uuid.uuid4())[:8].upper()
    
    client.qr_code = qr_id
    db.commit()
    
    return schemas.QRCodeResponse(
        qr_code=qr_id,
        qr_url=f"/clients/scan/{qr_id}",
        client_id=client_id
    )


@router.get("/scan/{qr_code}", response_model=schemas.ClientWithHistory)
async def scan_client_qr(
    qr_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Scan QR code and retrieve client details with complete treatment history - FOR RECEPTIONISTS"""
    client = db.query(models.Client).filter(models.Client.qr_code == qr_code).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found for this QR code")
    
    # Get client history
    total_appointments = db.query(func.count(models.Appointment.appointment_id)).filter(models.Appointment.client_id == client.client_id).scalar()
    
    total_spent = db.query(func.sum(models.Bill.final_amount)).filter(models.Bill.client_id == client.client_id).scalar() or 0.0
    
    last_appointment = db.query(models.Appointment).filter(models.Appointment.client_id == client.client_id).filter(models.Appointment.status == "completed").order_by(models.Appointment.appointment_date.desc()).first()
    
    # Get all treatments done (complete history)
    appointments = db.query(models.Appointment).filter(models.Appointment.client_id == client.client_id).order_by(models.Appointment.appointment_date.desc()).all()
    
    treatments_done = []
    for apt in appointments:
        treatment_name = apt.treatment.treatment_name if apt.treatment else "Unknown"
        amount = apt.treatment.price if apt.treatment else 0.0
        
        treatments_done.append(schemas.TreatmentHistoryItem(
            appointment_id=apt.appointment_id,
            treatment_name=treatment_name,
            appointment_date=apt.appointment_date,
            appointment_time=apt.appointment_time,
            status=apt.status,
            payment_status=apt.payment_status if hasattr(apt, 'payment_status') else None,
            amount=amount
        ))
    
    return schemas.ClientWithHistory(
        **client.__dict__,
        branch_name=client.branch.branch_name if client.branch else None,
        department_name=client.department.department_name if client.department else None,
        total_appointments=total_appointments,
        total_spent=total_spent,
        last_visit=last_appointment.created_at if last_appointment else None,
        treatments_done=treatments_done
    )


# ==================== PUBLIC QR SCAN (No Auth Required) ====================
@router.get("/public/scan/{qr_code}", response_model=schemas.ClientWithHistory)
async def public_scan_client_qr(
    qr_code: str,
    db: Session = Depends(get_db)
):
    """Public endpoint to scan QR code and retrieve client details - NO AUTHENTICATION REQUIRED
    The QR code itself serves as a secure token for accessing client data.
    """
    client = db.query(models.Client).filter(models.Client.qr_code == qr_code).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found for this QR code")
    
    # Get client history
    total_appointments = db.query(func.count(models.Appointment.appointment_id)).filter(models.Appointment.client_id == client.client_id).scalar()
    
    total_spent = db.query(func.sum(models.Bill.final_amount)).filter(models.Bill.client_id == client.client_id).scalar() or 0.0
    
    last_appointment = db.query(models.Appointment).filter(models.Appointment.client_id == client.client_id).filter(models.Appointment.status == "completed").order_by(models.Appointment.appointment_date.desc()).first()
    
    # Get all treatments done (complete history)
    appointments = db.query(models.Appointment).filter(models.Appointment.client_id == client.client_id).order_by(models.Appointment.appointment_date.desc()).all()
    
    treatments_done = []
    for apt in appointments:
        treatment_name = apt.treatment.treatment_name if apt.treatment else "Unknown"
        amount = apt.treatment.price if apt.treatment else 0.0
        
        treatments_done.append(schemas.TreatmentHistoryItem(
            appointment_id=apt.appointment_id,
            treatment_name=treatment_name,
            appointment_date=apt.appointment_date,
            appointment_time=apt.appointment_time,
            status=apt.status,
            payment_status=apt.payment_status if hasattr(apt, 'payment_status') else None,
            amount=amount
        ))
    
    return schemas.ClientWithHistory(
        **client.__dict__,
        branch_name=client.branch.branch_name if client.branch else None,
        department_name=client.department.department_name if client.department else None,
        total_appointments=total_appointments,
        total_spent=total_spent,
        last_visit=last_appointment.created_at if last_appointment else None,
        treatments_done=treatments_done
    )
