from database import SessionLocal, engine
from sqlalchemy import text

def migrate_bill_edit_status():
    db = SessionLocal()
    try:
        # Check if column exists
        result = db.execute(text("SHOW COLUMNS FROM bills LIKE 'edit_request_status'"))
        if result.fetchone():
            print("Column 'edit_request_status' already exists in 'bills' table.")
            return

        print("Adding 'edit_request_status' column to 'bills' table...")
        db.execute(text("ALTER TABLE bills ADD COLUMN edit_request_status VARCHAR(20) DEFAULT 'none' AFTER payment_status"))
        db.commit()
        print("Migration successful: Added 'edit_request_status' column.")
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_bill_edit_status()
