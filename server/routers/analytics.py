from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Branch, Client, Bill, Department, UserRole, Appointment, Product, Expense, AppointmentStatus
from auth import get_current_user
from typing import List, Dict, Any
from datetime import date, datetime, timedelta

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

@router.get("/dashboard")
def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Base queries
    bill_query = db.query(Bill)
    client_query = db.query(Client)
    appt_query = db.query(Appointment)
    product_query = db.query(Product)

    # Filter by Branch for non-Super Admins (or if user has branch_id)
    # Even Admins are usually branch-specific in this context if they are assigned to one.
    if current_user.branch_id:
        bill_query = bill_query.filter(Bill.branch_id == current_user.branch_id)
        client_query = client_query.filter(Client.branch_id == current_user.branch_id)
        appt_query = appt_query.filter(Appointment.branch_id == current_user.branch_id)
        product_query = product_query.filter(Product.branch_id == current_user.branch_id)

    # Filter by Department Strict Isolation
    if current_user.department_id:
        bill_query = bill_query.filter(Bill.department_id == current_user.department_id)
        client_query = client_query.filter(Client.department_id == current_user.department_id)
        appt_query = appt_query.filter(Appointment.department_id == current_user.department_id)
        product_query = product_query.filter(Product.department_id == current_user.department_id)

    # DEBUG LOGGING
    with open("dashboard_debug.log", "a") as f:
        f.write(f"User: {current_user.username}, Role: {current_user.role}, Br: {current_user.branch_id}, Dep: {current_user.department_id}\n")

    # 1. Revenue
    total_revenue = bill_query.with_entities(func.sum(Bill.final_amount)).scalar() or 0.0
    
    # Mock expenses logic for net_profit (can be updated to use Expense model later)
    total_expenses = total_revenue * 0.4 
    net_profit = total_revenue - total_expenses
    
    # 2. Appointments
    total_appointments = appt_query.count()
    completed_appointments = appt_query.filter(Appointment.status == 'completed').count()
    cancelled_appointments = appt_query.filter(Appointment.status == 'cancelled').count()

    # 3. Clients
    total_clients = client_query.count()
    
    # DEBUG LOGGING RESULTS
    with open("dashboard_debug.log", "a") as f:
        f.write(f"Rev: {total_revenue}, Appts: {total_appointments}, Clients: {total_clients}\n")
    
    today = date.today()
    first_of_month = today.replace(day=1)
    new_clients_this_month = client_query.filter(Client.created_at >= first_of_month).count()

    # 4. Low Stock
    low_stock_products = product_query.filter(Product.stock_qty <= Product.min_stock).count()

    return {
        "total_revenue": total_revenue,
        "net_profit": net_profit, 
        "total_appointments": total_appointments,
        "completed_appointments": completed_appointments,
        "cancelled_appointments": cancelled_appointments,
        "total_clients": total_clients,
        "new_clients_this_month": new_clients_this_month,
        "low_stock_products": low_stock_products
    }

@router.get("/revenue")
def get_revenue_analytics(
    period: str = 'month',
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Frontend expects array of objects with 'date' and 'revenue'
    # Mock data
    return [
        {"date": "2024-01-01", "revenue": 120000},
        {"date": "2024-02-01", "revenue": 190000},
        {"date": "2024-03-01", "revenue": 150000},
        {"date": "2024-04-01", "revenue": 220000},
        {"date": "2024-05-01", "revenue": 240000},
        {"date": "2024-06-01", "revenue": 280000},
        {"date": "2024-07-01", "revenue": 320000}
    ]

@router.get("/top-treatments")
def get_top_treatments(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Frontend expects: name, count
    return [
        {"name": "Full Body Laser", "count": 120},
        {"name": "HydraFacial", "count": 95},
        {"name": "Hair Transplant", "count": 45},
        {"name": "Botox", "count": 80},
        {"name": "PRP Therapy", "count": 110}
    ]

@router.get("/top-products")
def get_top_products(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Frontend expects: name, quantity_sold
    return [
        {"name": "L'Oreal Shampoo", "quantity_sold": 50},
        {"name": "Kerastase Oil", "quantity_sold": 35},
        {"name": "Skin Serum", "quantity_sold": 60},
        {"name": "Face Wash", "quantity_sold": 85},
        {"name": "Sunscreen", "quantity_sold": 45}
    ]

@router.get("/appointments-trend")
def get_appointments_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Frontend expects array of objects: date, completed, booked, cancelled
    # Mock data for last 14 days
    return [
        {"date": "2024-01-01", "completed": 5, "booked": 8, "cancelled": 1},
        {"date": "2024-01-02", "completed": 6, "booked": 7, "cancelled": 0},
        {"date": "2024-01-03", "completed": 8, "booked": 10, "cancelled": 2},
        {"date": "2024-01-04", "completed": 4, "booked": 5, "cancelled": 1},
        {"date": "2024-01-05", "completed": 7, "booked": 9, "cancelled": 0},
        {"date": "2024-01-06", "completed": 9, "booked": 12, "cancelled": 1},
        {"date": "2024-01-07", "completed": 3, "booked": 4, "cancelled": 0},
        {"date": "2024-01-08", "completed": 6, "booked": 8, "cancelled": 1},
        {"date": "2024-01-09", "completed": 8, "booked": 11, "cancelled": 2},
        {"date": "2024-01-10", "completed": 5, "booked": 7, "cancelled": 0},
        {"date": "2024-01-11", "completed": 7, "booked": 9, "cancelled": 1},
        {"date": "2024-01-12", "completed": 4, "booked": 6, "cancelled": 0},
        {"date": "2024-01-13", "completed": 8, "booked": 10, "cancelled": 2},
        {"date": "2024-01-14", "completed": 6, "booked": 8, "cancelled": 1},
    ]

@router.get("/client-stats")
def get_client_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Frontend expects: new_clients_this_month, retention_rate, total_clients, returning_clients
    total_clients = db.query(Client).count()
    return {
        "new_clients_this_month": 45,
        "retention_rate": 78,
        "total_clients": total_clients,
        "returning_clients": 120
    }

@router.get("/peak-hours")
def get_peak_hours(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # This one seems unused in Analytics.jsx but good to keep
    return {
        "hours": ["10 AM", "11 AM", "12 PM", "1 PM", "4 PM"],
        "counts": [15, 22, 18, 12, 20]
    }

# ==================== DOCTOR DASHBOARD ====================

@router.get("/doctor-stats")
def get_doctor_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Today's Appointments query
    today = date.today()
    today_query = db.query(Appointment).filter(
        Appointment.appointment_date == today,
        Appointment.status != AppointmentStatus.cancelled,
        Appointment.stylist_id == current_user.user_id
    )
    today_appointments = today_query.count()

    # 2. Total Patients (Unique clients treated by this doctor)
    # Join appointments -> client
    total_patients = db.query(Appointment.client_id).filter(
        Appointment.stylist_id == current_user.user_id,
        Appointment.status == AppointmentStatus.completed
    ).distinct().count()

    # 3. My Revenue
    # Sum of final_amount from Bills where stylist_id matches
    # OR sum from Appointments if using that for tracking (Bill is more accurate for revenue)
    my_revenue = db.query(func.sum(Bill.final_amount)).filter(
        Bill.stylist_id == current_user.user_id,
        Bill.payment_status == 'paid' # Only count paid bills? Or all? Let's say all for dashboard "generated"
    ).scalar() or 0.0

    # 4. Upcoming Appointments (limit 5)
    upcoming = db.query(Appointment).filter(
        Appointment.appointment_date >= today,
        Appointment.stylist_id == current_user.user_id,
        Appointment.status == AppointmentStatus.booked
    ).order_by(Appointment.appointment_date, Appointment.appointment_time).limit(5).all()

    upcoming_list = []
    for apt in upcoming:
        upcoming_list.append({
            "id": apt.appointment_id,
            "client_name": apt.client.name if apt.client else apt.guest_name,
            "treatment_name": apt.treatment.treatment_name,
            "date": apt.appointment_date,
            "time": apt.appointment_time,
            "status": apt.status
        })

    return {
        "doctor_name": current_user.full_name or current_user.username,
        "today_appointments": today_appointments,
        "total_patients": total_patients,
        "my_revenue": my_revenue,
        "upcoming_appointments": upcoming_list
    }


@router.get("/doctor-treatments")
def get_doctor_treatments(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get history of completed treatments by this doctor
    treatments = db.query(Appointment).filter(
        Appointment.stylist_id == current_user.user_id,
        Appointment.status == AppointmentStatus.completed
    ).order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc()).limit(limit).all()

    result = []
    for t in treatments:
        result.append({
            "id": t.appointment_id,
            "client_name": t.client.name if t.client else t.guest_name,
            "client_phone": t.client.phone if t.client else t.guest_phone,
            "treatment_name": t.treatment.treatment_name,
            "date": t.appointment_date,
            "time": t.appointment_time,
            "status": t.status,
            "payment_status": t.payment_status,
            "notes": t.notes,
            "price": t.treatment.price # OR t.bill.final_amount if bill exists
        })
    
    return result
