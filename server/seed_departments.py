from database import SessionLocal
from models import Department
from sqlalchemy import text

def seed_departments():
    db = SessionLocal()
    try:
        print("Checking departments...")
        
        # Target departments
        target_depts = [
            {"name": "Hair Skin Clinic", "desc": "Hair and Skin treatment department"},
            {"name": "Harskin", "desc": "Harskin operations"} 
        ]
        
        # Get a valid branch ID
        result = db.execute(text("SELECT branch_id FROM branches LIMIT 1"))
        branch_row = result.fetchone()
        branch_id = branch_row[0] if branch_row else 1
        print(f"Using Branch ID: {branch_id}")

        for target in target_depts:
            # Check if exists by name (approximate match or exact)
            # We want to ensure 'Harskin' exists.
            
            # Simple check
            exists = db.query(Department).filter(Department.department_name == target['name']).first()
            
            if exists:
                print(f"Department '{target['name']}' already exists.")
            else:
                print(f"Creating '{target['name']}'...")
                dept = Department(
                    department_name=target['name'],
                    description=target['desc'],
                    branch_id=branch_id,
                    is_active=True
                )
                db.add(dept)
        
        db.commit()
        print("✅ Seeding done.")
        
        # Verify
        final_depts = db.query(Department).all()
        print("\nFinal Departments List:")
        for d in final_depts:
            print(f"- {d.department_name} (ID: {d.department_id})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_departments()
