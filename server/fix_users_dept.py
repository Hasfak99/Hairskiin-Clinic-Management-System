from database import SessionLocal
from models import User, Department

db = SessionLocal()

# 1. Update Orphaned Users to Dept 1 (Hair Skin Clinic)
# Specific users: reception (id 2), manager (id 3)
users_to_fix = [2, 3]
for user_id in users_to_fix:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        print(f"Updating user {user.username} (ID {user.user_id})...")
        user.department_id = 1
        user.branch_id = 1 # Main Branch
        db.add(user)

# 2. Check for duplicate Department 3 and remove
dup_dept = db.query(Department).filter(Department.department_id == 3).first()
if dup_dept:
    print(f"Removing duplicate department: {dup_dept.department_name} (ID 3)")
    db.delete(dup_dept)

db.commit()
print("Fix applied successfully.")
