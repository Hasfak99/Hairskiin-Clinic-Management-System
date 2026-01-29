from database import engine
from sqlalchemy import text

def migrate():
    print("Starting migration: Adding department_id to products...")
    with engine.connect() as connection:
        try:
            print("Checking/Adding department_id...")
            check_sql = text("SHOW COLUMNS FROM products LIKE 'department_id'")
            if not connection.execute(check_sql).fetchone():
                sql = text("ALTER TABLE products ADD COLUMN department_id INTEGER NULL, ADD CONSTRAINT fk_products_department FOREIGN KEY (department_id) REFERENCES departments(department_id)")
                connection.execute(sql)
                print("Added department_id")
            else:
                print("department_id already exists")

            print("Migration completed successfully.")
            
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
