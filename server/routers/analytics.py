from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Branch, Client, Bill, Department, UserRole, Appointment
from auth import get_current_user
from typing import List, Dict, Any

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

from datetime import date, datetime, timedelta

@router.get("/doctor-stats")
def get_doctor_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.doctor and current_user.role != UserRole.super_admin:
         raise HTTPException(status_code=403, detail="Not authorized")

    today = date.today()
    
    # 1. Today's Appointments
    today_appointments_count = db.query(Appointment).filter(
        Appointment.stylist_id == current_user.user_id,
        func.date(Appointment.appointment_date) == today,
        Appointment.status != 'cancelled'
    ).count()
    
    # 2. Total Patients (Unique clients treated)
    # distinct client_ids from appointments assigned to this doctor
    total_patients = db.query(Appointment.client_id).filter(
        Appointment.stylist_id == current_user.user_id
    ).distinct().count()
    
    # 3. Personal Revenue
    # Sum of bills where stylist_id is this user
    my_revenue = db.query(func.sum(Bill.final_amount)).filter(
        Bill.stylist_id == current_user.user_id,
        Bill.payment_status == 'paid'
    ).scalar() or 0.0
    
    # 4. Upcoming Appointments (Next 5)
    upcoming = db.query(Appointment).filter(
        Appointment.stylist_id == current_user.user_id,
        Appointment.appointment_date >= today,
        Appointment.status != 'cancelled'
    ).order_by(Appointment.appointment_date, Appointment.appointment_time).limit(5).all()
    
    # Format upcoming appointments
    upcoming_list = []
    for apt in upcoming:
        client_name = apt.client.name if apt.client else "Unknown"
        treatment_name = apt.treatment.treatment_name if apt.treatment else "Unknown"
        upcoming_list.append({
            "id": apt.appointment_id,
            "client_name": client_name,
            "treatment_name": treatment_name,
            "date": apt.appointment_date,
            "time": apt.appointment_time,
            "status": apt.status
        })
        
    return {
        "today_appointments": today_appointments_count,
        "total_patients": total_patients,
        "my_revenue": my_revenue,
        "upcoming_appointments": upcoming_list
    }

@router.get("/super-admin", response_model=List[Dict[str, Any]])
def get_super_admin_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure only super_admin can access this
    if current_user.role != UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get all departments
    departments = db.query(Department).all()
    
    dashboard_data = []
    
    # Calculate for "All Departments" / "No Department" aggregation if needed? 
    # The requirement is "department wise etc hairskin (all total)"
    # So we will return a list of department metrics + maybe a "Total" row?
    # Let's iterate through departments.
    
    for dept in departments:
        dept_id = dept.department_id
        
        # Total Users in this department
        user_count = db.query(User).filter(User.department_id == dept_id).count()
        
        # Total Branches linked to this department
        # Departments can be linked to a branch, or used across branches if branch_id is null?
        # Model: Department has branch_id (ForeignKey). 
        # But wait, User has branch_id AND department_id. 
        # Client has branch_id AND department_id.
        # The requirement asks for "how many total branch in". 
        # If a department is specific to a branch, it's 1. If it's global, it might be used in multiple?
        # Actually, let's count how many distinct branches have usage of this department (e.g. users or bills or clients in this dept)
        # OR just use the department's linked branch if strictly hierarchical.
        # Looking at models.py: Department has branch_id. So a department belongs to ONE branch?
        # If Department.branch_id is Null, maybe it's global?
        # Let's check schema/values.
        # In current setup "Hairskiin" and "Hair Skin Clinic" seem to be the main "brands" or "departments".
        
        # Let's count actvity based metrics.
        
        # Clients in this department
        client_count = db.query(Client).filter(Client.department_id == dept_id).count()
        
        # Revenue for this department
        revenue = db.query(func.sum(Bill.final_amount)).filter(Bill.department_id == dept_id).scalar() or 0.0
        
        # Active Branches for this department
        # If department is linked to a branch
        branch_count = 0
        if dept.branch_id:
            branch_count = 1
        else:
            # If global department, maybe count branches that have transactions for this dept?
            # Or just count all branches if it is a major "Brand" department?
            # Let's simple count branches that have users associated with this department
            branch_count = db.query(User.branch_id).filter(User.department_id == dept_id).distinct().count()
            
        dashboard_data.append({
            "department_name": dept.department_name,
            "department_id": dept.department_id,
            "total_users": user_count,
            "total_clients": client_count,
            "total_branches": branch_count,
            "total_revenue": revenue
        })
        
    return dashboard_data

# ==================== STANDARD ANALYTICS ENDPOINTS ====================

@router.get("/dashboard")
def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Match frontend: total_revenue, net_profit, completed_appointments, cancelled_appointments
    total_revenue = db.query(func.sum(Bill.final_amount)).scalar() or 0.0
    
    # Mock expenses logic for net_profit
    total_expenses = total_revenue * 0.4 
    net_profit = total_revenue - total_expenses
    
    completed_appointments = db.query(func.count(Appointment.appointment_id)).filter(
        Appointment.status == 'completed'
    ).scalar()
    
    cancelled_appointments = db.query(func.count(Appointment.appointment_id)).filter(
        Appointment.status == 'cancelled'
    ).scalar()

    return {
        "total_revenue": total_revenue,
        "net_profit": net_profit, 
        "completed_appointments": completed_appointments,
        "cancelled_appointments": cancelled_appointments
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
