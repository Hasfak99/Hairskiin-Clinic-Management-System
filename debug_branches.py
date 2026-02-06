from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from server.database import SQLALCHEMY_DATABASE_URL
from server import models

# Setup DB connection (using the same URL as the app)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("--- DEPARTMENTS ---")
depts = db.query(models.Department).all()
for d in depts:
    print(f"ID: {d.department_id}, Name: {d.department_name}")

print("\n--- BRANCHES ---")
branches = db.query(models.Branch).all()
for b in branches:
    print(f"ID: {b.branch_id}, Name: {b.branch_name}, DeptID: {b.department_id}")

print("\n--- USERS (Directors) ---")
directors = db.query(models.User).filter(models.User.role == 'director').all()
for u in directors:
    print(f"User: {u.username}, Role: {u.role}, DeptID: {u.department_id}, BranchID: {u.branch_id}")

print("\n--- USERS (All) ---")
users = db.query(models.User).limit(5).all()
for u in users:
    print(f"User: {u.username}, Role: {u.role}, DeptID: {u.department_id}, BranchID: {u.branch_id}")
