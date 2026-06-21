from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, List, Any
import json
from datetime import datetime
import models
import database
import auth
from database import engine

router = APIRouter(
    prefix="/backup",
    tags=["Backup"],
    dependencies=[Depends(auth.get_current_active_user)]
)

# Helper to serialize SQLAlchemy objects
def serialize_model(instance):
    data = {}
    for column in instance.__table__.columns:
        value = getattr(instance, column.name)
        if isinstance(value, datetime):
            value = value.isoformat()
        data[column.name] = value
    return data

@router.get("/export")
def export_data(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")

    data = {
        "branches": [serialize_model(x) for x in db.query(models.Branch).all()],
        "departments": [serialize_model(x) for x in db.query(models.Department).all()],
        "users": [serialize_model(x) for x in db.query(models.User).all()],
        "clients": [serialize_model(x) for x in db.query(models.Client).all()],
        "treatments": [serialize_model(x) for x in db.query(models.Treatment).all()],
        "products": [serialize_model(x) for x in db.query(models.Product).all()],
        "appointments": [serialize_model(x) for x in db.query(models.Appointment).all()],
        "bills": [],
        "bill_details": []
    }

    data["bills"] = [serialize_model(x) for x in db.query(models.Bill).all()]
    data["bill_details"] = [serialize_model(x) for x in db.query(models.BillDetail).all()]

    return data

@router.post("/import")
async def import_data(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        # Helper to upsert
        def upsert(model_class, items):
            for item_data in items:
                # Basic upsert logic: try to find by PK, if exists update, else create
                # This is simplified; assumes PK is 'id' or specific field based on model
                
                # Determine PK based on model
                pk_field = None
                if model_class == models.Branch: pk_field = 'branch_id'
                elif model_class == models.Department: pk_field = 'department_id'
                elif model_class == models.User: pk_field = 'user_id'
                elif model_class == models.Client: pk_field = 'client_id'
                elif model_class == models.Treatment: pk_field = 'treatment_id'
                elif model_class == models.Product: pk_field = 'product_id'
                elif model_class == models.Appointment: pk_field = 'appointment_id'
                elif model_class == models.Bill: pk_field = 'bill_id'
                elif model_class == models.BillDetail: pk_field = 'bill_detail_id'

                if not pk_field: continue

                pk_value = item_data.get(pk_field)
                existing = db.query(model_class).filter(getattr(model_class, pk_field) == pk_value).first()

                if existing:
                    for key, value in item_data.items():
                        setattr(existing, key, value)
                else:
                    new_item = model_class(**item_data)
                    db.add(new_item)
            db.commit()

        # Order matters for foreign keys
        if "branches" in data: upsert(models.Branch, data["branches"])
        if "departments" in data: upsert(models.Department, data["departments"])
        if "users" in data: upsert(models.User, data["users"])
        if "clients" in data: upsert(models.Client, data["clients"])
        if "treatments" in data: upsert(models.Treatment, data["treatments"])
        if "products" in data: upsert(models.Product, data["products"])
        if "appointments" in data: upsert(models.Appointment, data["appointments"])
        if "bills" in data: upsert(models.Bill, data["bills"])
        if "bill_details" in data: upsert(models.BillDetail, data["bill_details"])

        return {"message": "Data imported successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
