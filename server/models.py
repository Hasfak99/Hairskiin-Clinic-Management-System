from sqlalchemy import Column, Integer, String, Float, Date, Time, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    receptionist = "receptionist"
    manager = "manager"
    cashier = "cashier"
    director = "director"
    doctor = "doctor"


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class AppointmentStatus(str, enum.Enum):
    booked = "booked"
    completed = "completed"
    cancelled = "cancelled"


class ItemType(str, enum.Enum):
    treatment = "treatment"
    product = "product"


# ==================== BRANCHES ====================
class Branch(Base):
    __tablename__ = "branches"

    branch_id = Column(Integer, primary_key=True, index=True)
    branch_name = Column(String(100), nullable=False, index=True)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="branch")
    clients = relationship("Client", back_populates="branch")
    appointments = relationship("Appointment", back_populates="branch")
    bills = relationship("Bill", back_populates="branch")
    products = relationship("Product", back_populates="branch")
    treatments = relationship("Treatment", back_populates="branch")
    expenses = relationship("Expense", back_populates="branch")
    departments = relationship("Department", back_populates="branch")


# ==================== DEPARTMENTS ====================
class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True)
    department_name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="departments")
    users = relationship("User", back_populates="department")
    products = relationship("Product", back_populates="department")
    clients = relationship("Client", back_populates="department")
    treatments = relationship("Treatment", back_populates="department")
    bills = relationship("Bill", back_populates="department")
    appointments = relationship("Appointment", back_populates="department")


# ==================== USERS ====================
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    user_code = Column(String(20), unique=True, nullable=True, index=True)  # USR-YYYY-MM-DD-XXX
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default=UserRole.receptionist.value)
    status = Column(String(20), default=UserStatus.active.value)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="users")
    department = relationship("Department", back_populates="users")


# ==================== CLIENTS ====================
class Client(Base):
    __tablename__ = "clients"

    client_id = Column(Integer, primary_key=True, index=True)
    client_code = Column(String(20), unique=True, nullable=True, index=True)  # CLT-YYYY-MM-DD-XXX
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    dob = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    client_type = Column(String(20), default="registered")  # "guest" or "registered"
    qr_code = Column(String(100), unique=True, nullable=True, index=True)  # Unique QR identifier
    registered_from_appointment = Column(Integer, nullable=True)  # Just stores ID, no FK to avoid circular ref
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="clients")
    department = relationship("Department", back_populates="clients")
    appointments = relationship("Appointment", back_populates="client")
    bills = relationship("Bill", back_populates="client")


# ==================== TREATMENTS ====================
class Treatment(Base):
    __tablename__ = "treatments"

    treatment_id = Column(Integer, primary_key=True, index=True)
    treatment_name = Column(String(100), nullable=False, index=True)
    treatment_code = Column(String(20), unique=True, nullable=True, index=True)  # custom ID like TRT-2026-001
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    duration = Column(Integer, nullable=False)  # in minutes
    category = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_global = Column(Boolean, default=False)  # True = shared across all branches
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="treatments")
    department = relationship("Department", back_populates="treatments")
    appointments = relationship("Appointment", back_populates="treatment")


# ==================== PRODUCTS ====================
class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(20), unique=True, nullable=True, index=True)  # PRD-YYYY-MM-DD-XXX
    product_name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock_qty = Column(Integer, default=0)
    min_stock = Column(Integer, default=5)  # Low stock alert threshold
    category = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_global = Column(Boolean, default=False)  # True = shared across all branches
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="products")
    department = relationship("Department", back_populates="products")


# ==================== APPOINTMENTS ====================
class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=True)  # Nullable for walk-ins
    treatment_id = Column(Integer, ForeignKey("treatments.treatment_id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True, index=True)
    stylist_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(Time, nullable=False)
    status = Column(String(20), default=AppointmentStatus.booked.value)
    # Walk-in guest details
    guest_name = Column(String(100), nullable=True)  # For walk-in appointments
    guest_phone = Column(String(20), nullable=True)
    # Payment tracking
    payment_status = Column(String(20), default="pending")  # "pending", "paid"
    converted_to_client = Column(Boolean, default=False)  # Guest converted to registered client
    notes = Column(Text, nullable=True)
    notification_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="appointments")
    client = relationship("Client", back_populates="appointments")
    department = relationship("Department", back_populates="appointments")
    treatment = relationship("Treatment", back_populates="appointments")
    stylist = relationship("User", foreign_keys=[stylist_id])
    bill = relationship("Bill", back_populates="appointment", uselist=False)


# ==================== BILLS ====================
class Bill(Base):
    __tablename__ = "bills"

    bill_id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True, index=True)
    stylist_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    total_amount = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    final_amount = Column(Float, default=0.0)
    payment_method = Column(String(50), nullable=True)
    payment_status = Column(String(20), default="pending")
    bill_date = Column(DateTime, server_default=func.now())
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="bills")
    department = relationship("Department", back_populates="bills", foreign_keys=[department_id])
    client = relationship("Client", back_populates="bills")
    appointment = relationship("Appointment", back_populates="bill")
    stylist = relationship("User", foreign_keys=[stylist_id])
    details = relationship("BillDetail", back_populates="bill", cascade="all, delete-orphan")


# ==================== BILL DETAILS ====================
class BillDetail(Base):
    __tablename__ = "bill_details"

    bill_detail_id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.bill_id"), nullable=False)
    item_type = Column(String(20), nullable=False)  # 'treatment' or 'product'
    item_id = Column(Integer, nullable=False)
    item_name = Column(String(100), nullable=False)  # Denormalized for invoice history
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    # Relationships
    bill = relationship("Bill", back_populates="details")


# ==================== EXPENSES (Optional for Analytics) ====================
class Expense(Base):
    __tablename__ = "expenses"

    expense_id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False)  # salary, rent, utilities, etc.
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    expense_date = Column(Date, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="expenses")
