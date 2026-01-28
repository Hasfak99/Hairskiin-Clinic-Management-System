"""
Migration script to add departments table and department_id column to users (MySQL)
"""
from sqlalchemy import text, inspect
from database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_mysql():
    session = SessionLocal()
    try:
        connection = engine.connect()
        inspector = inspect(engine)
        
        # 1. Check and Create departments table
        if not inspector.has_table("departments"):
            logger.info("Creating departments table...")
            connection.execute(text("""
                CREATE TABLE departments (
                    department_id INT AUTO_INCREMENT PRIMARY KEY,
                    department_name VARCHAR(100) NOT NULL,
                    description TEXT,
                    branch_id INT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
                    INDEX (department_name),
                    INDEX (branch_id)
                ) ENGINE=InnoDB;
            """))
            logger.info("✅ departments table created!")
            
            # Insert default departments
            logger.info("Inserting default departments...")
            
            # We assume branch_id 1 exists (Main Branch) from previous seeds.
            # If not, we might need a fallback or just insert regardless (FK constraints might fail if 1 doesn't exist).
            # To be safe, let's check for a valid branch first or default to 1.
            result = connection.execute(text("SELECT branch_id FROM branches LIMIT 1"))
            row = result.fetchone()
            branch_id = row[0] if row else 1
            
            connection.execute(text(f"""
                INSERT INTO departments (department_name, description, branch_id, is_active)
                VALUES 
                ('Hair Skin Clinic', 'Hair and Skin treatment department', {branch_id}, 1),
                ('Harskin SriLanka', 'Harskin SriLanka operations', {branch_id}, 1)
            """))
            logger.info("✅ Default departments inserted!")
        else:
            logger.info("departments table already exists.")

        # 2. Check and Add department_id to users table
        columns = [col['name'] for col in inspector.get_columns("users")]
        if "department_id" not in columns:
            logger.info("Adding department_id column to users table...")
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN department_id INT,
                ADD CONSTRAINT fk_users_department 
                FOREIGN KEY (department_id) REFERENCES departments(department_id);
            """))
            logger.info("✅ department_id column added to users!")
        else:
            logger.info("department_id column already exists in users table.")
            
        connection.commit()
    except Exception as e:
        logger.error(f"❌ Migration Error: {e}")
    finally:
        connection.close()
        session.close()

if __name__ == "__main__":
    migrate_mysql()
