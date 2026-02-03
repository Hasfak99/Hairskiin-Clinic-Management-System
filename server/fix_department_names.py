from sqlalchemy.orm import Session
from database import SessionLocal
import models

def fix_department_names():
    db = SessionLocal()
    try:
        # 1. Rename "Harskinin Clinic" or similar to "Hairskin"
        # Or if "Hair Skin Clinic" exists, use that.
        
        # Check existing departments
        depts = db.query(models.Department).all()
        target_dept = None
        
        # Prefer "Hair Skin Clinic" or "Hairskin"
        for d in depts:
            if d.department_name in ["Hair Skin Clinic", "Hairskin"]:
                target_dept = d
                break
        
        if not target_dept:
            print("Creating 'Hairskin' department...")
            target_dept = models.Department(department_name="Hairskin", branch_id=1) # Default branch 1
            db.add(target_dept)
            db.commit()
            db.refresh(target_dept)
        else:
            print(f"Using target department: {target_dept.department_name} (ID: {target_dept.department_id})")
            # Ensure it is named "Hairskin" if user specifically asked for that, or "Hair Skin Clinic"?
            # User said: "not show appointment hairskin"
            # I'll standardise to "Hairskin" if that's what they seem to imply, or "Hair Skin Clinic". 
            # Existing code uses "Hair Skin Clinic". I'll stick to "Hair Skin Clinic" but arguably "Hairskin" is shorter.
            # Let's rename typo ones.

        # Find typo departments
        typo_depts = db.query(models.Department).filter(models.Department.department_name.ilike('%Harskin%')).all()
        for bad_dept in typo_depts:
            if bad_dept.department_id != target_dept.department_id:
                print(f"Migrating from {bad_dept.department_name} (ID: {bad_dept.department_id}) to {target_dept.department_name}")
                
                # Move Appointments
                db.query(models.Appointment).filter(models.Appointment.department_id == bad_dept.department_id).update({"department_id": target_dept.department_id})
                
                # Move Treatments
                db.query(models.Treatment).filter(models.Treatment.department_id == bad_dept.department_id).update({"department_id": target_dept.department_id})
                
                # Move Users
                db.query(models.User).filter(models.User.department_id == bad_dept.department_id).update({"department_id": target_dept.department_id})
                
                # Delete bad dept
                # db.delete(bad_dept) # Optional, strictly speaking safer to keep or disable
                bad_dept.department_name = f"{bad_dept.department_name} (Deprecated)"
                bad_dept.is_active = False

        db.commit()
        
        # Update ALL treatments to have this department if missing
        db.query(models.Treatment).filter(models.Treatment.department_id == None).update({"department_id": target_dept.department_id})
        
        # Update ALL appointments to have this department if missing (or from treatment)
        # Inherit from treatment first
        apts = db.query(models.Appointment).filter(models.Appointment.department_id == None).all()
        count = 0
        for a in apts:
            if a.treatment:  # Treatment should now have dept
                a.department_id = a.treatment.department_id or target_dept.department_id
                count += 1
        
        db.commit()
        print(f"Updated {count} appointments.")
        print("Done.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_department_names()
