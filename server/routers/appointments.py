from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import date, datetime, timedelta
from datetime import date, datetime, timedelta
import math
import uuid
from database import get_db
import models
import schemas
from auth import require_any_role, require_admin

router = APIRouter(prefix="/appointments", tags=["Appointments"])



@router.get("/", response_model=schemas.PaginatedResponse[schemas.AppointmentResponse])
async def get_appointments(
    page: int = 1,
    size: int = 20,
    date_from: Optional[date] = Query(None, description="Filter from date"),
    date_to: Optional[date] = Query(None, description="Filter to date"),
    status: Optional[str] = Query(None, description="Filter by status"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get all appointments with optional filters and pagination"""
    query = db.query(models.Appointment)
    
    if date_from:
        query = query.filter(models.Appointment.appointment_date >= date_from)
    
    if date_to:
        query = query.filter(models.Appointment.appointment_date <= date_to)
    
    if status:
        query = query.filter(models.Appointment.status == status)
    
    if client_id:
        query = query.filter(models.Appointment.client_id == client_id)
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * size
    appointments = query.order_by(
        models.Appointment.appointment_date.desc(),
        models.Appointment.appointment_time.desc()
    ).offset(skip).limit(size).all()
    
    items = []
    for apt in appointments:
        apt_dict = apt.__dict__.copy()
        apt_dict['client_name'] = apt.client.name if apt.client else None
        apt_dict['treatment_name'] = apt.treatment.treatment_name if apt.treatment else None
        apt_dict['treatment_price'] = apt.treatment.price if apt.treatment else None
        apt_dict['department_name'] = apt.department.department_name if apt.department else None
        items.append(schemas.AppointmentResponse(**apt_dict))
    
    return schemas.PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size)
    )


@router.get("/today", response_model=List[schemas.AppointmentResponse])
async def get_today_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get today's appointments"""
    today = date.today()
    appointments = db.query(models.Appointment)\
        .filter(models.Appointment.appointment_date == today)\
        .order_by(models.Appointment.appointment_time)\
        .all()
    
    result = []
    for apt in appointments:
        apt_dict = apt.__dict__.copy()
        apt_dict['client_name'] = apt.client.name if apt.client else None
        apt_dict['treatment_name'] = apt.treatment.treatment_name if apt.treatment else None
        apt_dict['treatment_price'] = apt.treatment.price if apt.treatment else None
        apt_dict['department_name'] = apt.department.department_name if apt.department else None
        result.append(schemas.AppointmentResponse(**apt_dict))
    
    return result


@router.get("/upcoming", response_model=List[schemas.AppointmentResponse])
async def get_upcoming_appointments(
    days: int = Query(7, description="Number of days ahead"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get upcoming appointments for next N days"""
    today = date.today()
    end_date = today + timedelta(days=days)
    
    appointments = db.query(models.Appointment)\
        .filter(models.Appointment.appointment_date >= today)\
        .filter(models.Appointment.appointment_date <= end_date)\
        .filter(models.Appointment.status == "booked")\
        .order_by(models.Appointment.appointment_date, models.Appointment.appointment_time)\
        .all()
    
    result = []
    for apt in appointments:
        apt_dict = apt.__dict__.copy()
        apt_dict['client_name'] = apt.client.name if apt.client else None
        apt_dict['treatment_name'] = apt.treatment.treatment_name if apt.treatment else None
        apt_dict['treatment_price'] = apt.treatment.price if apt.treatment else None
        apt_dict['department_name'] = apt.department.department_name if apt.department else None
        result.append(schemas.AppointmentResponse(**apt_dict))
    
    return result


@router.get("/check-availability")
async def check_availability(
    appointment_date: date,
    treatment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Check available time slots for a specific date and treatment"""
    treatment = db.query(models.Treatment).filter(models.Treatment.treatment_id == treatment_id).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Get all booked appointments for that date
    booked = db.query(models.Appointment)\
        .filter(models.Appointment.appointment_date == appointment_date)\
        .filter(models.Appointment.status != "cancelled")\
        .all()
    
    # Generate time slots (9 AM to 6 PM, 30-minute intervals)
    available_slots = []
    for hour in range(9, 18):
        for minute in [0, 30]:
            slot_time = f"{hour:02d}:{minute:02d}"
            is_available = True
            
            for apt in booked:
                apt_time = apt.appointment_time.strftime("%H:%M")
                if apt_time == slot_time:
                    is_available = False
                    break
            
            available_slots.append({
                "time": slot_time,
                "available": is_available
            })
    
    return {
        "date": appointment_date,
        "treatment": treatment.treatment_name,
        "duration": treatment.duration,
        "slots": available_slots
    }


@router.get("/{appointment_id}", response_model=schemas.AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Get appointment by ID"""
    apt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    apt_dict = apt.__dict__.copy()
    apt_dict['client_name'] = apt.client.name if apt.client else None
    apt_dict['treatment_name'] = apt.treatment.treatment_name if apt.treatment else None
    apt_dict['treatment_price'] = apt.treatment.price if apt.treatment else None
    apt_dict['department_name'] = apt.department.department_name if apt.department else None
    
    return schemas.AppointmentResponse(**apt_dict)


@router.post("/", response_model=schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Create new appointment"""
    # Validate client exists
    client = db.query(models.Client).filter(models.Client.client_id == appointment.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Validate treatment exists
    treatment = db.query(models.Treatment).filter(models.Treatment.treatment_id == appointment.treatment_id).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Check for conflicting appointments
    existing = db.query(models.Appointment).filter(
        and_(
            models.Appointment.appointment_date == appointment.appointment_date,
            models.Appointment.appointment_time == appointment.appointment_time,
            models.Appointment.status != "cancelled"
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    db_appointment = models.Appointment(**appointment.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    apt_dict = db_appointment.__dict__.copy()
    apt_dict['client_name'] = client.name
    apt_dict['treatment_name'] = treatment.treatment_name
    apt_dict['treatment_price'] = treatment.price
    apt_dict['department_name'] = db_appointment.department.department_name if db_appointment.department else None
    
    return schemas.AppointmentResponse(**apt_dict)


@router.put("/{appointment_id}", response_model=schemas.AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    appointment_update: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Update appointment"""
    db_apt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not db_apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = appointment_update.model_dump(exclude_unset=True)
    
    if "status" in update_data:
        update_data["status"] = update_data["status"].value
    
    for key, value in update_data.items():
        setattr(db_apt, key, value)
    
    db.commit()
    db.refresh(db_apt)
    
    apt_dict = db_apt.__dict__.copy()
    apt_dict['client_name'] = db_apt.client.name if db_apt.client else None
    apt_dict['treatment_name'] = db_apt.treatment.treatment_name if db_apt.treatment else None
    apt_dict['treatment_price'] = db_apt.treatment.price if db_apt.treatment else None
    apt_dict['department_name'] = db_apt.department.department_name if db_apt.department else None
    
    return schemas.AppointmentResponse(**apt_dict)


@router.patch("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: int,
    status: str = Query(..., description="New status: booked, completed, cancelled"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Quick update appointment status"""
    if status not in ["booked", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    db_apt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not db_apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db_apt.status = status
    db.commit()
    
    return {"appointment_id": appointment_id, "status": status}


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Cancel appointment (soft delete)"""
    db_apt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not db_apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db_apt.status = "cancelled"
    db.commit()
    return None


@router.delete("/{appointment_id}/hard", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment_permanently(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Permanently delete appointment (Admin only)"""
    db_apt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not db_apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db.delete(db_apt)
    db.commit()
    return None


# ==================== WALK-IN APPOINTMENT ENDPOINTS ====================
@router.post("/walk-in", response_model=schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_walkin_appointment(
    appointment: schemas.WalkInAppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Create walk-in appointment without pre-registered client"""
    # Validate treatment exists
    treatment = db.query(models.Treatment).filter(models.Treatment.treatment_id == appointment.treatment_id).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Check for conflicting appointments
    existing = db.query(models.Appointment).filter(
        and_(
            models.Appointment.appointment_date == appointment.appointment_date,
            models.Appointment.appointment_time == appointment.appointment_time,
            models.Appointment.status != "cancelled"
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    # Create walk-in appointment (without client_id)
    db_appointment = models.Appointment(
        client_id=None,  # No client yet
        treatment_id=appointment.treatment_id,
        branch_id=appointment.branch_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        guest_name=appointment.guest_name,
        guest_phone=appointment.guest_phone,
        notes=appointment.notes,
        payment_status="pending",
        converted_to_client=False
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    # Build response
    apt_dict = db_appointment.__dict__.copy()
    apt_dict['client_name'] = appointment.guest_name  # Use guest name
    apt_dict['treatment_name'] = treatment.treatment_name
    apt_dict['treatment_price'] = treatment.price
    apt_dict['department_name'] = db_appointment.department.department_name if db_appointment.department else None
    
    return schemas.AppointmentResponse(**apt_dict)


@router.post("/{appointment_id}/convert-to-client", response_model=schemas.ClientResponse)
async def convert_guest_to_client(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Convert walk-in guest to registered client after payment"""
    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment.client_id:
        raise HTTPException(status_code=400, detail="Appointment already has a registered client")
    
    if not appointment.guest_name or not appointment.guest_phone:
        raise HTTPException(status_code=400, detail="Missing guest information")
    
    if appointment.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Payment must be completed before client registration")
    
    # Check if client with this phone already exists
    existing_client = db.query(models.Client).filter(
        models.Client.phone == appointment.guest_phone
    ).first()
    
    if existing_client:
        appointment.client_id = existing_client.client_id
        appointment.converted_to_client = True
        db.commit()
        db.refresh(existing_client)
        return existing_client
    
    # Create new client from guest details
    new_client = models.Client(
        name=appointment.guest_name,
        phone=appointment.guest_phone,
        branch_id=appointment.branch_id,
        client_type="registered",
        registered_from_appointment=appointment_id,
        qr_code=str(uuid.uuid4())[:8]  # Generate QR code
    )
    db.add(new_client)
    db.flush()
    
    # Link appointment to new client
    appointment.client_id = new_client.client_id
    appointment.converted_to_client = True
    
    db.commit()
    db.refresh(new_client)
    
    return new_client


@router.patch("/{appointment_id}/payment-status")
async def update_payment_status(
    appointment_id: int,
    payment_status: str = Query(..., description="Payment status: pending, paid"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Update appointment payment status"""
    if payment_status not in ["pending", "paid"]:
        raise HTTPException(status_code=400, detail="Invalid payment status")
    
    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.payment_status = payment_status
    db.commit()
    
    return {
        "appointment_id": appointment_id,
        "payment_status": payment_status,
        "message": "Payment status updated successfully"
    }
