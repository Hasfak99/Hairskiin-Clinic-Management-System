from database import SessionLocal
from models import User, Department

db = SessionLocal()

with open("debug_output.txt", "w") as f:
    f.write("--- DEPARTMENTS ---\n")
    depts = db.query(Department).all()
    for d in depts:
        f.write(f"ID: {d.department_id}, Name: {d.department_name}\n")

    f.write("\n--- USERS ---\n")
    users = db.query(User).all()
    for u in users:
        f.write(f"ID: {u.user_id}, Name: {u.username}, Role: {u.role}, Branch: {u.branch_id}, DeptID: {u.department_id}\n")
