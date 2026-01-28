from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, time, datetime
from enum import Enum


# ==================== ENUMS ====================
class UserRole(str, Enum):
    admin = "admin"
    receptionist = "receptionist"
    manager = "manager"


class UserStatus(str, Enum):
    active = "active"
    inactive = "inactive"


class AppointmentStatus(str, Enum):
    booked = "booked"
    completed = "completed"
    cancelled = "cancelled"


class ItemType(str, Enum):
    treatment = "treatment"
    product = "product"


# ==================== BRANCH SCHEMAS ====================
class BranchBase(BaseModel):
    branch_name: str = Field(..., min_length=2, max_length=100)
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class BranchCreate(BranchBase):
    pass


class BranchUpdate(BaseModel):
    branch_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class BranchResponse(BranchBase):
    branch_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== DEPARTMENT SCHEMAS ====================
class DepartmentBase(BaseModel):
    department_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    branch_id: Optional[int] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    department_name: Optional[str] = None
    description: Optional[str] = None
    branch_id: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentResponse(DepartmentBase):
    department_id: int
    is_active: bool
    created_at: datetime
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== AUTH ====================
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    branch_id: Optional[int] = None
    selected_branch_id: Optional[int] = None  # NEW: selected branch at login


class LoginRequest(BaseModel):
    username: str
    password: str


class BranchSelectionRequest(BaseModel):
    branch_id: int


# ==================== USER SCHEMAS ====================
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    role: UserRole = UserRole.receptionist
    branch_id: Optional[int] = None
    department_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    branch_id: Optional[int] = None
    department_id: Optional[int] = None


class UserResponse(UserBase):
    user_id: int
    status: UserStatus
    created_at: datetime
    branch_name: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== CLIENT SCHEMAS ====================
class ClientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[date] = None
    notes: Optional[str] = None
    client_type: Optional[str] = "registered"  # NEW: "guest" or "registered"
    qr_code: Optional[str] = None  # NEW: QR code identifier
    registered_from_appointment: Optional[int] = None  # NEW: conversion tracking
    branch_id: int


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[date] = None
    notes: Optional[str] = None


class ClientResponse(ClientBase):
    client_id: int
    created_at: datetime
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True


class TreatmentHistoryItem(BaseModel):
    """Individual treatment history record"""
    appointment_id: int
    treatment_name: str
    appointment_date: date
    appointment_time: time
    status: str
    payment_status: Optional[str] = None
    amount: Optional[float] = None


class ClientWithHistory(ClientResponse):
    total_appointments: int = 0
    total_spent: float = 0.0
    last_visit: Optional[datetime] = None
    treatments_done: List[TreatmentHistoryItem] = []  # NEW: List of all treatments


# ==================== TREATMENT SCHEMAS ====================
class TreatmentBase(BaseModel):
    treatment_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    duration: int = Field(..., gt=0)  # in minutes
    category: Optional[str] = None
    is_global: Optional[bool] = False  # NEW: shared across branches
    branch_id: Optional[int] = None


class TreatmentCreate(TreatmentBase):
    pass


class TreatmentUpdate(BaseModel):
    treatment_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    is_global: Optional[bool] = None  # NEW


class TreatmentResponse(TreatmentBase):
    treatment_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    product_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    stock_qty: int = Field(default=0, ge=0)
    min_stock: int = Field(default=5, ge=0)
    category: Optional[str] = None
    is_global: Optional[bool] = False  # NEW: shared across branches
    branch_id: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_qty: Optional[int] = None
    min_stock: Optional[int] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    is_global: Optional[bool] = None  # NEW


class ProductResponse(ProductBase):
    product_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== APPOINTMENT SCHEMAS ====================
class AppointmentBase(BaseModel):
    client_id: Optional[int] = None  # MODIFIED: Now optional for walk-ins
    treatment_id: int
    appointment_date: date
    appointment_time: time
    notes: Optional[str] = None
    guest_name: Optional[str] = None  # NEW: for walk-in appointments
    guest_phone: Optional[str] = None  # NEW
    payment_status: Optional[str] = "pending"  # NEW
    branch_id: int


class AppointmentCreate(AppointmentBase):
    pass


class WalkInAppointmentCreate(BaseModel):
    """Schema for walk-in appointments (no client_id required)"""
    guest_name: str
    guest_phone: str
    treatment_id: int
    appointment_date: date
    appointment_time: time
    notes: Optional[str] = None
    branch_id: int


class AppointmentUpdate(BaseModel):
    treatment_id: Optional[int] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    status: Optional[AppointmentStatus] = None
    payment_status: Optional[str] = None  # NEW
    notes: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    appointment_id: int
    status: AppointmentStatus
    notification_sent: bool
    converted_to_client: bool  # NEW
    created_at: datetime
    client_name: Optional[str] = None
    treatment_name: Optional[str] = None
    treatment_price: Optional[float] = None

    class Config:
        from_attributes = True


# ==================== BILL DETAIL SCHEMAS ====================
class BillDetailBase(BaseModel):
    item_type: ItemType
    item_id: int
    item_name: str
    quantity: int = Field(default=1, gt=0)
    unit_price: float = Field(..., gt=0)


class BillDetailCreate(BillDetailBase):
    pass


class BillDetailResponse(BillDetailBase):
    bill_detail_id: int
    total_price: float

    class Config:
        from_attributes = True


# ==================== BILL SCHEMAS ====================
class BillBase(BaseModel):
    client_id: int
    appointment_id: Optional[int] = None
    discount: float = Field(default=0.0, ge=0)
    tax: float = Field(default=0.0, ge=0)
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    branch_id: int


class BillCreate(BillBase):
    items: List[BillDetailCreate]


class BillUpdate(BaseModel):
    discount: Optional[float] = None
    tax: Optional[float] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class BillResponse(BillBase):
    bill_id: int
    total_amount: float
    final_amount: float
    payment_status: str
    bill_date: datetime
    details: List[BillDetailResponse] = []
    client_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== EXPENSE SCHEMAS ====================
class ExpenseBase(BaseModel):
    category: str
    description: Optional[str] = None
    amount: float = Field(..., gt=0)
    expense_date: date
    branch_id: int


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseResponse(ExpenseBase):
    expense_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ANALYTICS SCHEMAS ====================
class DashboardStats(BaseModel):
    total_revenue: float
    total_expenses: float
    net_profit: float
    total_clients: int
    new_clients_this_month: int
    total_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    low_stock_products: int


class RevenueData(BaseModel):
    date: str
    treatment_revenue: float
    product_revenue: float
    total: float


class TopItem(BaseModel):
    name: str
    count: int
    revenue: float


# ==================== GLOBAL SEARCH ====================
class SearchResult(BaseModel):
    type: str  # 'client', 'treatment', 'product', 'appointment'
    id: int
    title: str
    subtitle: Optional[str] = None
    url: str


# ==================== QR CODE SCHEMAS ====================
class QRCodeResponse(BaseModel):
    qr_code: str
    qr_url: str
    client_id: int
