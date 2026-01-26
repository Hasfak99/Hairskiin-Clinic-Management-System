"""
Clean setup - deletes old database and creates fresh one
"""
import sys
import os
sys.path.insert(0, '.')

# Delete old database if exists
if os.path.exists('hairskiin.db'):
    os.remove('hairskiin.db')
    print("✓ Deleted old database")

from database import SessionLocal, engine, Base
from models import User
from passlib.context import CryptContext

# Create password context with sha256_crypt
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

print("\n" + "=" * 50)
print("Hairskiin CRM - Fresh Setup")
print("=" * 50)

# Create tables
print("\n[1/2] Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✓ Tables created")

# Create admin user
print("\n[2/2] Creating admin user...")
db = SessionLocal()
try:
    admin = User(
        username="admin",
        password_hash=pwd_context.hash("admin123"),
        full_name="Administrator",
        role="admin",
        status="active"
    )
    db.add(admin)
    db.commit()
    print("✓ Admin user created")
except Exception as e:
    print(f"✗ Error: {e}")
    db.rollback()
finally:
    db.close()

print("\n" + "=" * 50)
print("✅ Setup Complete!")
print("=" * 50)
print("\nLogin Credentials:")
print("  Username: admin")
print("  Password: admin123")
print("\nStart server with:")
print("  python -m uvicorn main:app --reload --port 8000")
print("=" * 50)
