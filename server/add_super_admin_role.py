import sqlalchemy
from database import engine
from sqlalchemy import text

def add_super_admin_role():
    print("Attempting to update UserRole enum in MySQL...")
    with engine.connect() as connection:
        try:
            # MySQL syntax to update ENUM
            # We must list ALL existing values + the new one
            sql = """
            ALTER TABLE users 
            MODIFY COLUMN role 
            ENUM('admin', 'receptionist', 'manager', 'cashier', 'director', 'super_admin') 
            DEFAULT 'receptionist';
            """
            connection.execute(text(sql))
            connection.commit()
            print("Successfully updated UserRole enum to include 'super_admin'.")
        except Exception as e:
            print(f"Error updating database: {e}")

if __name__ == "__main__":
    add_super_admin_role()
