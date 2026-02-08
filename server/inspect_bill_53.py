import sys
import os

# Add server directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from database import SessionLocal
from models import User, Bill, Branch, Department

db = SessionLocal()

# Find user kma
kma = db.query(User).filter(User.username == 'kma').first()
if kma:
    print(f"User: {kma.username}, Role: {kma.role}, Branch ID: {kma.branch_id}, Dept ID: {kma.department_id}")
    if kma.branch:
        print(f"  Branch Name: {kma.branch.branch_name}")
    if kma.department:
        print(f"  Department Name: {kma.department.department_name}")
else:
    print("User 'kma' not found")

# Find Bill 53
bill = db.query(Bill).filter(Bill.bill_id == 53).first()
if bill:
    print(f"Bill 53: Branch ID: {bill.branch_id}, Dept ID: {bill.department_id}, Payment: {bill.payment_status}, Edit Req: {bill.edit_request_status}")
    if bill.branch:
        print(f"  Branch Name: {bill.branch.branch_name}")
    if bill.department:
        print(f"  Department Name: {bill.department.department_name}")
else:
    print("Bill 53 not found")
