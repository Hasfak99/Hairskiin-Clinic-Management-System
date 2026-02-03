from sqlalchemy.orm import Session
from database import SessionLocal
import models

def fix_data():
    db = SessionLocal()
    try:
        # 1. Ensure a department exists
        dept = db.query(models.Department).first()
        if not dept:
            print("No department found. Creating default 'Headquarters'...")
            dept = models.Department(
                department_name="Headquarters",
                description="Default Department created by migration fix",
                is_active=True
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            print(f"Created Department: {dept.department_name} (ID: {dept.department_id})")
        else:
            print(f"Using existing Department: {dept.department_name} (ID: {dept.department_id})")

        # 2. Update all branches with NULL department_id
        branches = db.query(models.Branch).filter(models.Branch.department_id == None).all()
        if branches:
            print(f"Found {len(branches)} branches with missing department_id. Updating...")
            for b in branches:
                b.department_id = dept.department_id
                print(f"  - Updated Branch '{b.branch_name}' -> Department '{dept.department_name}'")
            
            db.commit()
            print("All branches updated successfully.")
        else:
            # Check if Python sees them as None or 0 or if SQLAlchemy default logic kicks in
            # Just incase, lets do a raw update check
            print("No branches found with department_id == None via ORM.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_data()
