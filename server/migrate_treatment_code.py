from database import engine
from sqlalchemy import text

def migrate():
    print("Starting migration: Adding treatment_code column to treatments table...")
    with engine.connect() as connection:
        try:
            # Check if column exists first to avoid error
            check_sql = text("SHOW COLUMNS FROM treatments LIKE 'treatment_code'")
            result = connection.execute(check_sql).fetchone()
            
            if result:
                print("Column 'treatment_code' already exists. Skipping.")
                return

            # Add Column
            sql = text("ALTER TABLE treatments ADD COLUMN treatment_code VARCHAR(20) NULL UNIQUE")
            connection.execute(sql)
            print("Successfully added 'treatment_code' column.")
            
            # Add Index (optional, usually handled by UNIQUE constaint implicitly for lookup, but explicit index key is fine)
            # Since we made it UNIQUE, an index is created.
            
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
