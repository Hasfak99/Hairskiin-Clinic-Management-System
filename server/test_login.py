"""
Test script to verify login for all users
"""
import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models import User
from auth import authenticate_user, verify_password, get_password_hash

def test_login():
    db = SessionLocal()
    try:
        print("=" * 50)
        print("Testing User Authentication")
        print("=" * 50)
        
        # Test all users
        test_users = [
            ("admin", "admin123"),
            ("reception", "reception123"),
            ("manager", "manager123")
        ]
        
        for username, password in test_users:
            print(f"\nTesting: {username}")
            user = db.query(User).filter(User.username == username).first()
            
            if not user:
                print(f"  [ERROR] User '{username}' not found in database")
                continue
            
            print(f"  Found user: {user.username} (role: {user.role}, status: {user.status})")
            
            # Test authentication
            auth_result = authenticate_user(db, username, password)
            if auth_result:
                print(f"  [SUCCESS] Authentication passed")
                print(f"  User details: {auth_result.username}, Role: {auth_result.role}, Branch ID: {auth_result.branch_id}")
            else:
                print(f"  [FAILED] Authentication failed")
                
                # Debug password verification
                if user:
                    print(f"  Debugging password verification...")
                    print(f"  Stored hash: {user.password_hash[:50]}...")
                    test_hash = get_password_hash(password)
                    print(f"  New hash for '{password}': {test_hash[:50]}...")
                    verify_result = verify_password(password, user.password_hash)
                    print(f"  Password verification: {verify_result}")
        
        print("\n" + "=" * 50)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
