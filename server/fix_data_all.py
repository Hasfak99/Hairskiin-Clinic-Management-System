from sqlalchemy.orm import Session
from database import SessionLocal
import models

def fix_all():
    db = SessionLocal()
    try:
        # 1. Get Hair Skin Clinic Department
        # Assuming we want to map everything to 'Hair Skin Clinic' for now as requested
        dept = db.query(models.Department).filter(models.Department.department_name.ilike('%Hair%')).first()
        if not dept:
            print("Hair Skin Clinic department not found!")
            return
        
        print(f"Target Department: {dept.department_name} (ID: {dept.department_id})")

        # 2. Update all Treatments to have this department_id if they are None
        treatments = db.query(models.Treatment).filter(models.Treatment.department_id == None).all()
        print(f"Found {len(treatments)} treatments without department.")
        for t in treatments:
            t.department_id = dept.department_id
        
        db.commit()
        print("Treatments updated.")

        # 3. Update all Appointments to inherit from Treatment
        # We re-run this logic
        apts = db.query(models.Appointment).filter(models.Appointment.department_id == None).all()
        print(f"Found {len(apts)} appointments without department.")
        
        count = 0
        for a in apts:
             if a.treatment and a.treatment.department_id:
                 a.department_id = a.treatment.department_id
                 count += 1
        
        db.commit()
        print(f"Updated {count} appointments.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_all()
