from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Ensure tables exist (though they should)
# models.Base.metadata.create_all(bind=engine)

def list_info():
    db = SessionLocal()
    try:
        print("\n--- BRANCHES ---")
        branches = db.query(models.Branch).all()
        for b in branches:
            print(f"ID: {b.branch_id}, Name: '{b.branch_name}'")

        print("\n--- DEPARTMENTS ---")
        depts = db.query(models.Department).all()
        for d in depts:
            print(f"ID: {d.department_id}, Name: '{d.department_name}'")

    finally:
        db.close()

if __name__ == "__main__":
    list_info()
