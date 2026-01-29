from database import engine
from sqlalchemy import text

def migrate():
    print("Starting migration: Adding user_code column...")
    with engine.connect() as connection:
        try:
            print("Checking/Adding user_code...")
            check_sql = text("SHOW COLUMNS FROM users LIKE 'user_code'")
            if not connection.execute(check_sql).fetchone():
                sql = text("ALTER TABLE users ADD COLUMN user_code VARCHAR(20) NULL UNIQUE")
                connection.execute(sql)
                print("Added user_code")
            else:
                print("user_code already exists")

            print("Migration completed successfully.")
            
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
