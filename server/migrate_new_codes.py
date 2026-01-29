from database import engine
from sqlalchemy import text

def migrate():
    print("Starting migration: Adding code columns...")
    with engine.connect() as connection:
        try:
            # 1. Clients
            print("Checking/Adding client_code...")
            check_sql = text("SHOW COLUMNS FROM clients LIKE 'client_code'")
            if not connection.execute(check_sql).fetchone():
                sql = text("ALTER TABLE clients ADD COLUMN client_code VARCHAR(20) NULL UNIQUE")
                connection.execute(sql)
                print("Added client_code")
            else:
                print("client_code already exists")

            # 2. Products
            print("Checking/Adding product_code...")
            check_sql = text("SHOW COLUMNS FROM products LIKE 'product_code'")
            if not connection.execute(check_sql).fetchone():
                sql = text("ALTER TABLE products ADD COLUMN product_code VARCHAR(20) NULL UNIQUE")
                connection.execute(sql)
                print("Added product_code")
            else:
                print("product_code already exists")

            print("Migration completed successfully.")
            
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
