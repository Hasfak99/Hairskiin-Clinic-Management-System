
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Set up paths
SERVER_DIR = os.path.abspath(os.path.join(os.getcwd(), 'server'))
sys.path.append(SERVER_DIR)

from database import Base
from models import User
from schemas import UserResponse
import models

DB_URL = f"sqlite:///{os.path.join(SERVER_DIR, 'hairskiin.db')}"

def debug_get_users():
    print(f"Connecting to DB: {DB_URL}")
    engine = create_engine(DB_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    print("--- Querying Users ---")
    try:
        users = db.query(models.User).all()
        print(f"Found {len(users)} users.")
        
        for user in users:
            print(f"Processing user: {user.username} (Role: {user.role})")
            
            # Mimic logic from routers/users.py
            user_dict = user.__dict__.copy()
            
            # Helper to safely get branch/dept names
            user_dict['branch_name'] = user.branch.branch_name if user.branch else None
            user_dict['department_name'] = user.department.department_name if user.department else None
            
            # Try validation
            try:
                schema_user = UserResponse(**user_dict)
                print("  -> Validation OK")
            except Exception as e:
                print(f"  -> Validation FAILED: {e}")
                # Print details
                import traceback
                traceback.print_exc()
                
    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_get_users()
