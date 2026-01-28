from database import SessionLocal
from models import Department
from sqlalchemy import text

def check_departments():
    db = SessionLocal()
    try:
        departments = db.query(Department).all()
        print("Current Departments:")
        for d in departments:
            print(f"ID: {d.department_id}, Name: '{d.department_name}'")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_departments()
