from sqlalchemy.orm import Session
from database import SessionLocal
import models
from models import UserRole

def fix_user_roles():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        valid_roles = [role.value for role in UserRole]
        print(f"Valid roles: {valid_roles}")

        fixed_count = 0
        for user in users:
            if user.role not in valid_roles:
                print(f"User {user.username} (ID: {user.user_id}) has invalid role: '{user.role}'")
                # Default to receptionist if invalid
                user.role = UserRole.receptionist.value
                fixed_count += 1
                print(f"  -> Fixed to '{user.role}'")
        
        if fixed_count > 0:
            db.commit()
            print(f"Successfully fixed {fixed_count} users.")
        else:
            print("No users with invalid roles found.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_user_roles()
