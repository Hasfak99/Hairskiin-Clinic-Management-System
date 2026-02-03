from database import SessionLocal
from models import Bill, User

def check_status():
    db = SessionLocal()
    try:
        # Check Pending Bills
        pending_bills = db.query(Bill).filter(Bill.edit_request_status == 'pending').all()
        print(f"Pending Bills Count: {len(pending_bills)}")
        for b in pending_bills:
            print(f" - Bill #{b.bill_id} (Client: {b.client_id})")

        # Check User 'sfdg'
        user = db.query(User).filter(User.username == 'sfdg').first()
        if user:
            print(f"User 'sfdg' Role: {user.role}")
        else:
            print("User 'sfdg' not found")

    finally:
        db.close()

if __name__ == "__main__":
    check_status()
