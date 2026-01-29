from database import engine
from sqlalchemy import text
import sys

def migrate():
    print("Migrating bills table...")
    with engine.connect() as conn:
        try:
            # Check if column exists
            try:
                # MySQL check
                result = conn.execute(text("SHOW COLUMNS FROM bills LIKE 'department_id'"))
                if result.fetchone():
                    print("Column 'department_id' already exists in 'bills'. Skipping add column.")
                else:
                    raise Exception("Column not found")
            except Exception:
                # Add column
                print("Adding 'department_id' column...")
                conn.execute(text("ALTER TABLE bills ADD COLUMN department_id INT NULL"))
                conn.commit()
                print("Column added.")

            # Add foreign key (MySQL)
            try:
                print("Adding foreign key constraint...")
                conn.execute(text("ALTER TABLE bills ADD CONSTRAINT fk_bills_department FOREIGN KEY (department_id) REFERENCES departments(department_id)"))
                conn.commit()
                print("Foreign key added.")
            except Exception as e:
                print(f"Index or FK might already exist or failed: {e}")

            print("Migration successful.")
        except Exception as e:
            print(f"Migration failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    migrate()
