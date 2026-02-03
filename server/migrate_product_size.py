from database import SessionLocal, engine
from sqlalchemy import text

def migrate_product_size():
    db = SessionLocal()
    try:
        # Check if column exists
        result = db.execute(text("SHOW COLUMNS FROM products LIKE 'size'"))
        if result.fetchone():
            print("Column 'size' already exists in 'products' table.")
            return

        print("Adding 'size' column to 'products' table...")
        db.execute(text("ALTER TABLE products ADD COLUMN size VARCHAR(50) NULL AFTER category"))
        db.commit()
        print("Migration successful: Added 'size' column.")
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_product_size()
