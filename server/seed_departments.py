from database import SessionLocal, engine
import models

def seed_departments():
    db = SessionLocal()
    try:
        # Define required departments
        departments = ["Hair Skin Clinic", "Harskin"]
        
        # Check and create if not exists
        for dept_name in departments:
            dept = db.query(models.Department).filter(models.Department.department_name == dept_name).first()
            if not dept:
                print(f"Creating department: {dept_name}")
                new_dept = models.Department(department_name=dept_name, description=f"{dept_name} Department", branch_id=None, is_active=True)
                db.add(new_dept)
            else:
                print(f"Updating department: {dept_name}")
                dept.branch_id = None
                dept.is_active = True
                db.add(dept)
        
        db.commit()
        print("Department seeding completed.")
    except Exception as e:
        print(f"Error seeding departments: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_departments()
