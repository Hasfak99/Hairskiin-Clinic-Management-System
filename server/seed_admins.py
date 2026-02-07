from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, Branch, Department, UserRole
from auth import get_password_hash
from datetime import datetime

def seed_admins():
    db = SessionLocal()
    try:
        # 1. Find Main Branch (Borella)
        # Using ID 2 as per previous context, or searching by name
        branch = db.query(Branch).filter(Branch.branch_name.like("%Borella%")).first()
        if not branch:
            branch = db.query(Branch).filter(Branch.branch_name.like("%Main%")).first()
            if not branch:
                print("Error: Could not find 'Borella' or 'Main Branch'.")
                return

        print(f"Using Branch: {branch.branch_name} (ID: {branch.branch_id})")

        # 2. Find Departments
        dept_clinic = db.query(Department).filter(Department.department_name.like("%Hair Skin Clinic%")).first()
        dept_harskin = db.query(Department).filter(Department.department_name.like("%Harskin%")).first()

        if not dept_clinic:
            print("Error: Could not find 'Hair Skin Clinic' department.")
        
        if not dept_harskin:
            print("Error: Could not find 'Harskin' department.")

        # 3. Create Users
        users_to_create = []
        
        if dept_clinic:
            users_to_create.append({
                "username": "admin_hsc",
                "full_name": "Admin Hair Skin Clinic",
                "role": UserRole.admin,
                "branch_id": branch.branch_id,
                "department_id": dept_clinic.department_id
            })

        if dept_harskin:
            users_to_create.append({
                "username": "admin_harskin",
                "full_name": "Admin Harskin",
                "role": UserRole.admin,
                "branch_id": branch.branch_id,
                "department_id": dept_harskin.department_id
            })
            
            # SPECIFIC REQUEST: hsdir
            users_to_create.append({
                "username": "hsdir",
                "full_name": "Director Harskin",
                "role": UserRole.director,
                "branch_id": branch.branch_id, # User requested Main Branch
                "department_id": dept_harskin.department_id,
                "password": "12345678" 
            })

        for u_data in users_to_create:
            existing = db.query(User).filter(User.username == u_data["username"]).first()
            if existing:
                print(f"User {existing.username} already exists. Updating if needed.")
                # Optional: Update password/role if crucial
                if u_data["username"] == "hsdir":
                     existing.role = u_data["role"]
                     existing.department_id = u_data["department_id"]
                     if "password" in u_data:
                         existing.password_hash = get_password_hash(u_data["password"])
                     print(f"Updated {existing.username}")
                continue

            # Generate Code
            now = datetime.now()
            prefix = f"USR-{now.year}-{now.month:02d}-{now.day:02d}-"
            # Simple unique sequence just for seeding
            import random
            seq = random.randint(100, 999)
            user_code = f"{prefix}{seq}"
            
            pwd = u_data.get("password", "password123")

            new_user = User(
                username=u_data["username"],
                password_hash=get_password_hash(pwd),
                full_name=u_data["full_name"],
                role=u_data["role"],
                branch_id=u_data["branch_id"],
                department_id=u_data["department_id"],
                user_code=user_code,
                status="active"
            )
            db.add(new_user)
            print(f"Created User: {new_user.username} (Role: {new_user.role}, Dept: {u_data['department_id']})")
        
        db.commit()
        print("Seeding completed successfully.")

    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admins()
