from database import SessionLocal
import models

def list_departments():
    db = SessionLocal()
    try:
        depts = db.query(models.Department).all()
        print(f"{'ID':<5} {'Name':<20} {'BranchID':<10} {'Active':<10}")
        print("-" * 50)
        for d in depts:
            print(f"{d.department_id:<5} {d.department_name:<20} {str(d.branch_id):<10} {d.is_active:<10}")
    finally:
        db.close()

if __name__ == "__main__":
    list_departments()
