"""
Seed script to create default users for Hairskiin CRM
Run this script to create admin and receptionist accounts
"""
import sys
sys.path.insert(0, '.')

from database import SessionLocal, engine, Base
from models import User, Branch, Department
from auth import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

# Default branch to create
DEFAULT_BRANCH = {
    "branch_name": "Main Branch",
    "address": "123 Clinic Street",
    "phone": "0771234567",
    "email": "main@hairskiin.com",
    "is_active": True
}

# Default departments to create
DEFAULT_DEPARTMENTS = [
    {
        "department_name": "Hair Skin Clinic",
        "description": "Hair and Skin treatment department",
        "is_active": True
    },
    {
        "department_name": "Harskin SriLanka",
        "description": "Harskin SriLanka operations",
        "is_active": True
    }
]


# Default users to create
DEFAULT_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "full_name": "Administrator",
        "role": "admin",
        "status": "active"
    },
    {
        "username": "reception",
        "password": "reception123",
        "full_name": "Front Desk",
        "role": "receptionist",
        "status": "active"
    },
    {
        "username": "manager",
        "password": "manager123",
        "full_name": "Clinic Manager",
        "role": "manager",
        "status": "active"
    }
]

def seed_users():
    db = SessionLocal()
    try:
        # Create default branch first
        existing_branch = db.query(Branch).filter(Branch.branch_name == DEFAULT_BRANCH["branch_name"]).first()
        if existing_branch:
            print(f"Branch '{DEFAULT_BRANCH['branch_name']}' already exists, skipping...")
            branch = existing_branch
        else:
            branch = Branch(**DEFAULT_BRANCH)
            db.add(branch)
            db.commit()
            db.refresh(branch)
            print(f"Created branch: {branch.branch_name} (ID: {branch.branch_id})")
        
        # Create default departments
        print("\n🏬 Creating departments...")
        for dept_data in DEFAULT_DEPARTMENTS:
            existing_dept = db.query(Department).filter(Department.department_name == dept_data["department_name"]).first()
            if existing_dept:
                print(f"  Department '{dept_data['department_name']}' already exists, skipping...")
                continue
            dept = Department(
                department_name=dept_data["department_name"],
                description=dept_data["description"],
                branch_id=branch.branch_id,
                is_active=dept_data["is_active"]
            )
            db.add(dept)
            print(f"  Created department: {dept_data['department_name']}")
        db.commit()
        
        # Create users
        for user_data in DEFAULT_USERS:
            # Check if user exists
            existing = db.query(User).filter(User.username == user_data["username"]).first()
            if existing:
                print(f"User '{user_data['username']}' already exists, skipping...")
                continue
            
            # Create user with branch_id
            user = User(
                username=user_data["username"],
                password_hash=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                status=user_data["status"],
                branch_id=branch.branch_id
            )
            db.add(user)
            print(f"Created user: {user_data['username']} ({user_data['role']})")
        
        db.commit()
        print("\n✅ Seed completed successfully!")
        print(f"\n🏢 Default Branch: {branch.branch_name} (ID: {branch.branch_id})")
        print("\n🏬 Departments:")
        for dept in db.query(Department).all():
            print(f"  - {dept.department_name} (ID: {dept.department_id})")
        print("\n📋 Login Credentials:")
        print("-" * 40)
        for user in DEFAULT_USERS:
            print(f"  {user['role'].upper():15} | Username: {user['username']:12} | Password: {user['password']}")
        print("-" * 40)
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
