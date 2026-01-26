"""
Seed script to create default users for Hairskiin CRM
Run this script to create admin and receptionist accounts
"""
import sys
sys.path.insert(0, '.')

from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

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
        for user_data in DEFAULT_USERS:
            # Check if user exists
            existing = db.query(User).filter(User.username == user_data["username"]).first()
            if existing:
                print(f"User '{user_data['username']}' already exists, skipping...")
                continue
            
            # Create user
            user = User(
                username=user_data["username"],
                password_hash=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                status=user_data["status"]
            )
            db.add(user)
            print(f"Created user: {user_data['username']} ({user_data['role']})")
        
        db.commit()
        print("\n✅ Seed completed successfully!")
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
