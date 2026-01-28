"""
Migration script to add departments table and department_id column to users
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'hairskiin.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if departments table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='departments'")
        if not cursor.fetchone():
            print("Creating departments table...")
            cursor.execute('''
                CREATE TABLE departments (
                    department_id INTEGER PRIMARY KEY,
                    department_name VARCHAR(100) NOT NULL,
                    description TEXT,
                    branch_id INTEGER REFERENCES branches(branch_id),
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS ix_departments_department_id ON departments (department_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS ix_departments_department_name ON departments (department_name)')
            cursor.execute('CREATE INDEX IF NOT EXISTS ix_departments_branch_id ON departments (branch_id)')
            print("✅ departments table created!")
            
            # Insert default departments
            cursor.execute('''
                INSERT INTO departments (department_name, description, branch_id, is_active)
                VALUES ('Hair Skin Clinic', 'Hair and Skin treatment department', 1, 1)
            ''')
            cursor.execute('''
                INSERT INTO departments (department_name, description, branch_id, is_active)
                VALUES ('Harskin SriLanka', 'Harskin SriLanka operations', 1, 1)
            ''')
            print("✅ Default departments created!")
        else:
            print("departments table already exists")
        
        # Check if department_id column exists in users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'department_id' not in columns:
            print("Adding department_id column to users table...")
            cursor.execute('ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(department_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS ix_users_department_id ON users (department_id)')
            print("✅ department_id column added to users!")
        else:
            print("department_id column already exists in users table")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Show departments
        cursor.execute("SELECT * FROM departments")
        depts = cursor.fetchall()
        print("\n🏬 Departments:")
        for dept in depts:
            print(f"  {dept}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
