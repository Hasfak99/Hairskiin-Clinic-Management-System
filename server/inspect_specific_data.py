from sqlalchemy.orm import Session
from database import SessionLocal
import models
import sys

# Windows console encoding fix
sys.stdout.reconfigure(encoding='utf-8')

def inspect_data():
    db = SessionLocal()
    try:
        print("\n--- BRANCHES ---")
        branches = db.query(models.Branch).all()
        for b in branches:
            print(f"ID: {b.branch_id}, Name: {b.branch_name}")

        print("\n--- DEPARTMENTS ---")
        depts = db.query(models.Department).all()
        for d in depts:
            print(f"ID: {d.department_id}, Name: {d.department_name}")

        print("\n--- USERS (Directors/Admins) ---")
        users = db.query(models.User).filter(
            (models.User.role.in_(['director', 'admin', 'manager']))
        ).all()
        for u in users:
            b_name = u.branch.branch_name if u.branch else "None"
            d_name = u.department.department_name if u.department else "None"
            print(f"User: {u.username}, Role: {u.role}, Branch: {b_name} ({u.branch_id}), Dept: {d_name} ({u.department_id})")

        print("\n--- TREATMENTS (Hair Skin Clinic) ---")
        # Find 'Hair Skin Clinic' department first
        hsc_dept = db.query(models.Department).filter(models.Department.department_name.ilike('%Hair%Skin%Clinic%')).first()
        if hsc_dept:
            print(f"Found Dept: {hsc_dept.department_name} (ID: {hsc_dept.department_id})")
            treatments = db.query(models.Treatment).filter(models.Treatment.department_id == hsc_dept.department_id).all()
            for t in treatments:
                b_name = t.branch.branch_name if t.branch else "Global"
                print(f"T: {t.treatment_name}, Branch: {b_name} ({t.branch_id}), Active: {t.is_active}")
        else:
            print("Could not find 'Hair Skin Clinic' department.")
            
        print("\n--- TREATMENTS (Hair Skin - if different) ---")
        hs_dept = db.query(models.Department).filter(models.Department.department_name == 'HairSkin').first()
        if hs_dept:
             print(f"Found Dept: {hs_dept.department_name} (ID: {hs_dept.department_id})")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_data()
