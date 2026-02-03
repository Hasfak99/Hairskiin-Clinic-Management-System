import sqlalchemy
from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Starting migration...")
        
        # 1. Add department_id to branches
        try:
            conn.execute(text("ALTER TABLE branches ADD COLUMN department_id INTEGER"))
            print("Added department_id column to branches")
        except Exception as e:
            print(f"Skipping add department_id: {e}")

        # 2. Add Foreign Key constraint (optional but recommended)
        try:
            conn.execute(text("ALTER TABLE branches ADD CONSTRAINT fk_branch_department FOREIGN KEY (department_id) REFERENCES departments(department_id)"))
            print("Added foreign key constraint to branches")
        except Exception as e:
            print(f"Skipping add FK: {e}")

        # 3. Remove branch_id from departments
        try:
            conn.execute(text("ALTER TABLE departments DROP FOREIGN KEY departments_ibfk_1")) # Assumes default FK name, might fail
            print("Dropped FK from departments")
        except Exception as e:
            print(f"Skipping drop FK: {e}")

        try:
            conn.execute(text("ALTER TABLE departments DROP COLUMN branch_id"))
            print("Dropped branch_id column from departments")
        except Exception as e:
            print(f"Skipping drop branch_id: {e}")

        print("Migration complete!")

if __name__ == "__main__":
    migrate()
