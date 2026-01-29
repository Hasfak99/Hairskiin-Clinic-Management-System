from database import SessionLocal, engine
from sqlalchemy import text

def add_department_id_to_clients():
    db = SessionLocal()
    try:
        # Check if column exists
        result = db.execute(text("SHOW COLUMNS FROM clients LIKE 'department_id'"))
        if result.fetchone():
            print("Column 'department_id' already exists in 'clients' table.")
        else:
            print("Adding 'department_id' column to 'clients' table...")
            db.execute(text("ALTER TABLE clients ADD COLUMN department_id INT NULL"))
            db.execute(text("ALTER TABLE clients ADD CONSTRAINT fk_clients_department FOREIGN KEY (department_id) REFERENCES departments(department_id)"))
            print("Column added successfully.")
            
        db.commit()
    except Exception as e:
        print(f"Error during migration: {e}")
        # Identify if it's SQLite or MySQL. The constraints syntax differs slightly but ALTER TABLE ADD COLUMN is standard.
        # If SQLite, SHOW COLUMNS might fail or look different (PRAGMA table_info).
        # Assuming MySQL based on XAMPP context.
    finally:
        db.close()

if __name__ == "__main__":
    add_department_id_to_clients()
