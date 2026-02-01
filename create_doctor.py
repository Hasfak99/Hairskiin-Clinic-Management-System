
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'server')))
from server.database import Base
from server.models import User, UserRole
from server.auth import get_password_hash
import server.models as models

DB_URL = "sqlite:///server/hairskiin.db"

def create_doctor():
    engine = create_engine(DB_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if doctor exists
        doctor = db.query(User).filter(User.username == "te_doctor").first()
        if not doctor:
            print("Creating doctor user...")
            new_user = User(
                username="te_doctor",
                password_hash=get_password_hash("password123"),
                full_name="Test Doctor",
                role="doctor",
                branch_id=1,
                status="active"
            )
            db.add(new_user)
            db.commit()
            print("Doctor user created.")
        else:
            print("Doctor user already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_doctor()
