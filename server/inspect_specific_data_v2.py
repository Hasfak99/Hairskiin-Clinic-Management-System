from sqlalchemy.orm import Session
from database import SessionLocal
import models
import sys

def inspect_data():
    db = SessionLocal()
    output = []
    try:
        output.append("\n--- BRANCHES ---")
        branches = db.query(models.Branch).all()
        for b in branches:
            output.append(f"ID: {b.branch_id}, Name: {b.branch_name}")

        output.append("\n--- DEPARTMENTS ---")
        depts = db.query(models.Department).all()
        for d in depts:
            output.append(f"ID: {d.department_id}, Name: {d.department_name}")

        output.append("\n--- USERS (Directors/Admins) ---")
        users = db.query(models.User).filter(
            (models.User.role.in_(['director', 'admin', 'manager']))
        ).all()
        for u in users:
            b_name = u.branch.branch_name if u.branch else "None"
            d_name = u.department.department_name if u.department else "None"
            output.append(f"User: {u.username}, Role: {u.role}, Branch: {b_name} ({u.branch_id}), Dept: {d_name} ({u.department_id})")

        output.append("\n--- TREATMENTS (Hair Skin Clinic) ---")
        # Find 'Hair Skin Clinic' department first
        hsc_dept = db.query(models.Department).filter(models.Department.department_name.ilike('%Hair%Skin%Clinic%')).first()
        if hsc_dept:
            output.append(f"Found Dept: {hsc_dept.department_name} (ID: {hsc_dept.department_id})")
            treatments = db.query(models.Treatment).filter(models.Treatment.department_id == hsc_dept.department_id).all()
            for t in treatments:
                b_name = t.branch.branch_name if t.branch else "Global"
                output.append(f"T: {t.treatment_name}, Branch: {b_name} ({t.branch_id}), Active: {t.is_active}")
        else:
            output.append("Could not find 'Hair Skin Clinic' department.")
            
        output.append("\n--- TREATMENTS (HairSkin - if different) ---")
        hs_dept = db.query(models.Department).filter(models.Department.department_name == 'HairSkin').first()
        if hs_dept:
             output.append(f"Found Dept: {hs_dept.department_name} (ID: {hs_dept.department_id})")

    except Exception as e:
        output.append(f"Error: {e}")
    finally:
        db.close()
        
    with open("debug_output_direct.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(output))

if __name__ == "__main__":
    inspect_data()
