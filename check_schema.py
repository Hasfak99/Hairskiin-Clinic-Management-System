"""
Quick fix for login 500 error after schema changes
"""
import sys
sys.path.insert(0, 'server')

from database import SessionLocal
import models

def check_database_compatibility():
    """Check if database has all required columns"""
    print("=" * 60)
    print("DATABASE COMPATIBILITY CHECK")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Try to query a user (this will fail if schema is incompatible)
        print("\n1. Testing User model...")
        user = db.query(models.User).first()
        if user:
            print(f"✓ User found: {user.username}")
        else:
            print("⚠️ No users found (run seed.py to create admin)")
        
        # Check if new client fields exist
        print("\n2. Testing Client model with new fields...")
        client = db.query(models.Client).first()
        if client:
            print(f"✓ Client model OK")
            # Check new fields
            if hasattr(client, 'qr_code'):
                print(f"  ✓ qr_code field exists: {client.qr_code}")
            if hasattr(client, 'client_type'):
                print(f"  ✓ client_type field exists: {client.client_type}")
        else:
            print("⚠️ No clients found (this is OK for fresh database)")
        
        # Check appointments
        print("\n3. Testing Appointment model...")
        apt = db.query(models.Appointment).first()
        if apt:
            print(f"✓ Appointment model OK")
            if hasattr(apt, 'payment_status'):
                print(f"  ✓ payment_status field exists: {apt.payment_status}")
            if hasattr(apt, 'guest_name'):
                print(f"  ✓ guest_name field exists: {apt.guest_name}")
        else:
            print("⚠️ No appointments found (this is OK)")
        
        print("\n" + "=" * 60)
        print("✅ DATABASE IS COMPATIBLE")
        print("=" * 60)
        print("\nNext step: Restart your backend server")
        return True
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ DATABASE COMPATIBILITY ERROR")
        print("=" * 60)
        print(f"\nError: {e}")
        print("\nThis means the migration did not run properly.")
        print("\nFix: Run the migration again:")
        print("  python migrate_api_redesign.py")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    check_database_compatibility()
