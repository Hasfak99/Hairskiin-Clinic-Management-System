"""
New endpoints for walk-in appointments and client conversion
Append these to the appointments.py router file
"""

# Add to server/routers/appointments.py after line 278

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
    
    return schemas.AppointmentResponse(**apt_dict)


@router.post("/{appointment_id}/convert-to-client", response_model=schemas.ClientResponse)
async def convert_guest_to_client(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role)
):
    """Convert walk-in guest to registered client after payment"""
    # Get the appointment
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
        # Link existing client to appointment
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
