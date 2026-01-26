from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date, datetime, timedelta
from database import get_db
import models
import schemas
from auth import require_admin_or_manager, require_any_role, get_branch_id_dependency

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    branch_id: Optional[int] = Query(None, description="Filter by branch"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any_role),
    current_branch_id: Optional[int] = Depends(get_branch_id_dependency)
):
    """Get dashboard overview statistics"""
    today = date.today()
    first_day_of_month = today.replace(day=1)
    
    # Filter by branch_id
    filter_branch_id = branch_id if branch_id else current_branch_id
    
    # Total revenue (this month)
    revenue_query = db.query(func.sum(models.Bill.final_amount))\
        .filter(models.Bill.bill_date >= first_day_of_month)\
        .filter(models.Bill.payment_status == "paid")
    if filter_branch_id:
        revenue_query = revenue_query.filter(models.Bill.branch_id == filter_branch_id)
    total_revenue = revenue_query.scalar() or 0.0
    
    # Total expenses (this month)
    expense_query = db.query(func.sum(models.Expense.amount))\
        .filter(models.Expense.expense_date >= first_day_of_month)
    if filter_branch_id:
        expense_query = expense_query.filter(models.Expense.branch_id == filter_branch_id)
    total_expenses = expense_query.scalar() or 0.0
    
    # Net profit
    net_profit = total_revenue - total_expenses
    
    # Total clients
    client_query = db.query(func.count(models.Client.client_id))
    if filter_branch_id:
        client_query = client_query.filter(models.Client.branch_id == filter_branch_id)
    total_clients = client_query.scalar()
    
    # New clients this month
    new_clients_query = db.query(func.count(models.Client.client_id))\
        .filter(models.Client.created_at >= first_day_of_month)
    if filter_branch_id:
        new_clients_query = new_clients_query.filter(models.Client.branch_id == filter_branch_id)
    new_clients = new_clients_query.scalar()
    
    # Appointment stats
    apt_query = db.query(func.count(models.Appointment.appointment_id))\
        .filter(models.Appointment.appointment_date >= first_day_of_month)
    if filter_branch_id:
        apt_query = apt_query.filter(models.Appointment.branch_id == filter_branch_id)
    total_appointments = apt_query.scalar()
    
    completed_query = db.query(func.count(models.Appointment.appointment_id))\
        .filter(models.Appointment.appointment_date >= first_day_of_month)\
        .filter(models.Appointment.status == "completed")
    if filter_branch_id:
        completed_query = completed_query.filter(models.Appointment.branch_id == filter_branch_id)
    completed_appointments = completed_query.scalar()
    
    cancelled_query = db.query(func.count(models.Appointment.appointment_id))\
        .filter(models.Appointment.appointment_date >= first_day_of_month)\
        .filter(models.Appointment.status == "cancelled")
    if filter_branch_id:
        cancelled_query = cancelled_query.filter(models.Appointment.branch_id == filter_branch_id)
    cancelled_appointments = cancelled_query.scalar()
    
    # Low stock products
    low_stock_query = db.query(func.count(models.Product.product_id))\
        .filter(models.Product.is_active == True)\
        .filter(models.Product.stock_qty <= models.Product.min_stock)
    if filter_branch_id:
        low_stock_query = low_stock_query.filter(models.Product.branch_id == filter_branch_id)
    low_stock = low_stock_query.scalar()
    
    return schemas.DashboardStats(
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_profit=net_profit,
        total_clients=total_clients,
        new_clients_this_month=new_clients,
        total_appointments=total_appointments,
        completed_appointments=completed_appointments,
        cancelled_appointments=cancelled_appointments,
        low_stock_products=low_stock
    )


@router.get("/revenue")
async def get_revenue_analytics(
    period: str = Query("month", description="Period: week, month, year"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Get revenue analytics by period"""
    today = date.today()
    
    if period == "week":
        start_date = today - timedelta(days=7)
    elif period == "year":
        start_date = today - timedelta(days=365)
    else:  # month
        start_date = today - timedelta(days=30)
    
    # Get daily revenue
    bills = db.query(
        func.date(models.Bill.bill_date).label('date'),
        func.sum(models.Bill.final_amount).label('total')
    ).filter(
        models.Bill.bill_date >= start_date,
        models.Bill.payment_status == "paid"
    ).group_by(
        func.date(models.Bill.bill_date)
    ).order_by('date').all()
    
    return [{"date": str(b.date), "revenue": b.total} for b in bills]


@router.get("/top-treatments")
async def get_top_treatments(
    limit: int = Query(10, description="Number of top treatments"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Get top performing treatments"""
    today = date.today()
    first_day_of_month = today.replace(day=1)
    
    # Count completed appointments by treatment
    treatments = db.query(
        models.Treatment.treatment_name,
        func.count(models.Appointment.appointment_id).label('count'),
        func.sum(models.Treatment.price).label('revenue')
    ).join(
        models.Appointment
    ).filter(
        models.Appointment.status == "completed",
        models.Appointment.appointment_date >= first_day_of_month
    ).group_by(
        models.Treatment.treatment_id
    ).order_by(
        func.count(models.Appointment.appointment_id).desc()
    ).limit(limit).all()
    
    return [{"name": t.treatment_name, "count": t.count, "revenue": t.revenue or 0} for t in treatments]


@router.get("/top-products")
async def get_top_products(
    limit: int = Query(10, description="Number of top products"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Get top selling products"""
    today = date.today()
    first_day_of_month = today.replace(day=1)
    
    products = db.query(
        models.BillDetail.item_name,
        func.sum(models.BillDetail.quantity).label('qty_sold'),
        func.sum(models.BillDetail.total_price).label('revenue')
    ).join(
        models.Bill
    ).filter(
        models.BillDetail.item_type == "product",
        models.Bill.bill_date >= first_day_of_month
    ).group_by(
        models.BillDetail.item_id
    ).order_by(
        func.sum(models.BillDetail.quantity).desc()
    ).limit(limit).all()
    
    return [{"name": p.item_name, "quantity_sold": p.qty_sold, "revenue": p.revenue} for p in products]


@router.get("/appointments-trend")
async def get_appointments_trend(
    days: int = Query(30, description="Number of days"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Get appointment trends over time"""
    start_date = date.today() - timedelta(days=days)
    
    appointments = db.query(
        models.Appointment.appointment_date,
        models.Appointment.status,
        func.count(models.Appointment.appointment_id).label('count')
    ).filter(
        models.Appointment.appointment_date >= start_date
    ).group_by(
        models.Appointment.appointment_date,
        models.Appointment.status
    ).order_by(
        models.Appointment.appointment_date
    ).all()
    
    # Organize by date
    trend_data = {}
    for apt in appointments:
        date_str = str(apt.appointment_date)
        if date_str not in trend_data:
            trend_data[date_str] = {"booked": 0, "completed": 0, "cancelled": 0}
        trend_data[date_str][apt.status] = apt.count
    
    return [{"date": k, **v} for k, v in sorted(trend_data.items())]


@router.get("/client-stats")
async def get_client_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Get client statistics"""
    today = date.today()
    first_day_of_month = today.replace(day=1)
    last_month = first_day_of_month - timedelta(days=1)
    first_day_last_month = last_month.replace(day=1)
    
    # New clients this month vs last month
    new_this_month = db.query(func.count(models.Client.client_id))\
        .filter(models.Client.created_at >= first_day_of_month)\
        .scalar()
    
    new_last_month = db.query(func.count(models.Client.client_id))\
        .filter(models.Client.created_at >= first_day_last_month)\
        .filter(models.Client.created_at < first_day_of_month)\
        .scalar()
    
    # Returning clients (clients with more than 1 appointment)
    returning_clients = db.query(func.count(func.distinct(models.Appointment.client_id)))\
        .filter(
            models.Appointment.client_id.in_(
                db.query(models.Appointment.client_id)\
                    .group_by(models.Appointment.client_id)\
                    .having(func.count(models.Appointment.appointment_id) > 1)
            )
        ).scalar()
    
    total_clients = db.query(func.count(models.Client.client_id)).scalar()
    
    return {
        "total_clients": total_clients,
        "new_clients_this_month": new_this_month,
        "new_clients_last_month": new_last_month,
        "returning_clients": returning_clients,
        "retention_rate": round((returning_clients / total_clients * 100), 2) if total_clients > 0 else 0
    }


@router.get("/peak-hours")
async def get_peak_hours(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    """Get peak booking hours"""
    # SQLite doesn't have native hour extraction, use strftime
    appointments = db.query(
        func.strftime('%H', models.Appointment.appointment_time).label('hour'),
        func.count(models.Appointment.appointment_id).label('count')
    ).filter(
        models.Appointment.status != "cancelled"
    ).group_by(
        func.strftime('%H', models.Appointment.appointment_time)
    ).order_by('hour').all()
    
    return [{"hour": int(a.hour), "appointments": a.count} for a in appointments]
