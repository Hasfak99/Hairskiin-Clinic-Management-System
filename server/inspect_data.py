from sqlalchemy.orm import Session
from database import SessionLocal
import models

def inspect_data():
    db = SessionLocal()
    try:
        print("--- DEPARTMENTS ---")
        depts = db.query(models.Department).all()
        for d in depts:
            print(f"ID: {d.department_id}, Name: {d.department_name}, Branch: {d.branch_id}")

        print("\n--- TREATMENTS ---")
        treatments = db.query(models.Treatment).all()
        for t in treatments:
            print(f"ID: {t.treatment_id}, Name: {t.treatment_name}, DeptID: {t.department_id}")

        print("\n--- APPOINTMENTS DETAIL ---")
        apts = db.query(models.Appointment).all()
        for a in apts:
            dept_name = a.department.department_name if a.department else "None"
            print(f"AptID: {a.appointment_id}, DeptID: {a.department_id}, DeptName: {dept_name}")
            
        print("\n--- DEPARTMENTS DETAIL ---")
        depts = db.query(models.Department).all()
        for d in depts:
             print(f"ID: {d.department_id}, Name: {d.department_name}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_data()
