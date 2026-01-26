"""
Test script to verify database and create admin user
"""
import sys
sys.path.insert(0, '.')

from database import SessionLocal, engine, Base
from models import User
from passlib.context import CryptContext

# Create password context
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def test_setup():
    print("=" * 50)
    print("Hairskiin CRM - Setup Test")
    print("=" * 50)
    
    # Create tables
    print("\n[1/3] Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        return
    
    # Create admin user
    print("\n[2/3] Creating admin user...")
    db = SessionLocal()
    try:
        # Check if admin exists
        existing = db.query(User).filter(User.username == "admin").first()
        if existing:
            print("✓ Admin user already exists")
        else:
            # Create admin
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
            print("   Username: admin")
            print("   Password: admin123")
    except Exception as e:
        print(f"✗ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()
    
    # Test password verification
    print("\n[3/3] Testing password verification...")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if user:
            test_password = "admin123"
            is_valid = pwd_context.verify(test_password, user.password_hash)
            if is_valid:
                print("✓ Password verification works")
            else:
                print("✗ Password verification failed")
        else:
            print("✗ Admin user not found")
    except Exception as e:
        print(f"✗ Error testing password: {e}")
    finally:
        db.close()
    
    print("\n" + "=" * 50)
    print("Setup complete! Try logging in with:")
    print("Username: admin")
    print("Password: admin123")
    print("=" * 50)

if __name__ == "__main__":
    test_setup()
