from database import engine
from sqlalchemy import text

def migrate():
    print("Starting migration: Removing sub_category from products...")
    with engine.connect() as connection:
        try:
            print("Checking for sub_category column...")
            check_sql = text("SHOW COLUMNS FROM products LIKE 'sub_category'")
            if connection.execute(check_sql).fetchone():
                sql = text("ALTER TABLE products DROP COLUMN sub_category")
                connection.execute(sql)
                print("Removed sub_category")
            else:
                print("sub_category column does not exist")

            print("Migration completed successfully.")
            
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
