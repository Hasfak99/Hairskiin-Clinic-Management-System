from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import date, datetime, timedelta
from database import get_db
import models
import schemas
from auth import require_any_role, get_branch_id_dependency

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("/", response_model=List[schemas.AppointmentResponse])
async def get_appointments(
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[date] = Query(None, description="Filter from date"),
    date_to: Optional[date] = Query(None, description="Filter to date"),
    status: Optional[str] = Query(None, description="Filter by status"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    branch_id: Optional[int] = Query(None, description="Filter by branch"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Get all appointments with optional filters"""
    query = db.query(models.Appointment)
    
    # Filter by branch_id - only if provided or user has a branch
    # If user has no branch_id, show all appointments
    filter_branch_id = branch_id if branch_id else current_branch_id
    if filter_branch_id is not None:
        # Show appointments for this branch OR appointments with no branch (global)
        query = query.filter(
            (models.Appointment.branch_id == filter_branch_id) | 
            (models.Appointment.branch_id.is_(None))
        )
    
    if date_from:
        query = query.filter(models.Appointment.appointment_date >= date_from)
    
    if date_to:
        query = query.filter(models.Appointment.appointment_date <= date_to)
    
    if status:
        query = query.filter(models.Appointment.status == status)
    
    if client_id:
        query = query.filter(models.Appointment.client_id == client_id)
    
    appointments = query.order_by(
        models.Appointment.appointment_date.desc(),
        models.Appointment.appointment_time.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for apt in appointments:
        apt_dict = apt.__dict__.copy()
        apt_dict['client_name'] = apt.client.name if apt.client else None
        apt_dict['treatment_name'] = apt.treatment.treatment_name if apt.treatment else None
        apt_dict['treatment_price'] = apt.treatment.price if apt.treatment else None
        result.append(schemas.AppointmentResponse(**apt_dict))
    
    return result


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
    
    return schemas.AppointmentResponse(**apt_dict)


@router.post("/", response_model=schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Create new appointment"""
    # Use branch_id from request or user's branch
    branch_id = appointment.branch_id if appointment.branch_id else current_branch_id
    if not branch_id:
        raise HTTPException(status_code=400, detail="Branch ID is required")
    
    # Validate client exists and belongs to branch
    client = db.query(models.Client).filter(
        models.Client.client_id == appointment.client_id,
        models.Client.branch_id == branch_id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found in this branch")
    
    # Validate treatment exists and belongs to branch
    treatment = db.query(models.Treatment).filter(
        models.Treatment.treatment_id == appointment.treatment_id,
        models.Treatment.branch_id == branch_id
    ).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found in this branch")
    
    # Check for conflicting appointments in same branch
    existing = db.query(models.Appointment).filter(
        and_(
            models.Appointment.appointment_date == appointment.appointment_date,
            models.Appointment.appointment_time == appointment.appointment_time,
            models.Appointment.status != "cancelled",
            models.Appointment.branch_id == branch_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    appointment_data = appointment.model_dump()
    appointment_data['branch_id'] = branch_id
    db_appointment = models.Appointment(**appointment_data)
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    apt_dict = db_appointment.__dict__.copy()
    apt_dict['client_name'] = client.name
    apt_dict['treatment_name'] = treatment.treatment_name
    apt_dict['treatment_price'] = treatment.price
    
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
