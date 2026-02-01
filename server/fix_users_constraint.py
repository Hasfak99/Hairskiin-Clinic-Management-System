
import sqlite3
import shutil
import os

DB_FILE = "hairskiin.db"
BACKUP_FILE = "hairskiin.db.bak"

def fix_users_table():
    if not os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} not found.")
        return

    # Backup first
    shutil.copy(DB_FILE, BACKUP_FILE)
    print(f"Backup created at {BACKUP_FILE}")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    try:
        # Check current state
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        has_users = cursor.fetchone() is not None
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_old';")
        has_users_old = cursor.fetchone() is not None
        
        if has_users and has_users_old:
            print("Both users and users_old exist. Assuming users_old is the valid backup from failed run.")
            print("Dropping potentially incomplete 'users' table...")
            cursor.execute("DROP TABLE users;")
            has_users = False
            
        if has_users and not has_users_old:
            # 1. Rename existing users table
            print("Renaming users table...")
            cursor.execute("ALTER TABLE users RENAME TO users_old;")
            
            # Drop old indices so we can reuse names
            print("Dropping old indices...")
            indices = ["ix_users_user_id", "ix_users_branch_id", "ix_users_username", "ix_users_user_code", "ix_users_department_id"]
            for idx in indices:
                cursor.execute(f"DROP INDEX IF EXISTS {idx};")
        
        elif has_users_old and not has_users:
            print("users_old exists but users does not. Resuming migration...")
        
        else:
            print("No users table found?")
            return
            
        # Unconditionally drop potential conflicting indices
        print("Ensuring indices are clear...")
        indices = ["ix_users_user_id", "ix_users_branch_id", "ix_users_username", "ix_users_user_code", "ix_users_department_id"]
        for idx in indices:
            cursor.execute(f"DROP INDEX IF EXISTS {idx};")
        
        # 2. Create new users table (Taken from current model definition, simplified for SQLite)
        # Note: We use TEXT for role, no CHECK constraint
        print("Creating new users table...")
        create_table_sql = """
        CREATE TABLE users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_code VARCHAR(20) UNIQUE,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            role VARCHAR(20) DEFAULT 'receptionist',
            status VARCHAR(20) DEFAULT 'active',
            branch_id INTEGER,
            department_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(branch_id) REFERENCES branches(branch_id),
            FOREIGN KEY(department_id) REFERENCES departments(department_id)
        );
        """
        cursor.execute(create_table_sql)
        
        # Create indices
        cursor.execute("CREATE INDEX ix_users_user_id ON users (user_id);")
        cursor.execute("CREATE INDEX ix_users_branch_id ON users (branch_id);")
        cursor.execute("CREATE INDEX ix_users_username ON users (username);")
        cursor.execute("CREATE INDEX ix_users_user_code ON users (user_code);")
        cursor.execute("CREATE INDEX ix_users_department_id ON users (department_id);")

        # 3. Copy data
        print("Copying data...")
        # Get columns from old table to ensure match
        cursor.execute("PRAGMA table_info(users_old);")
        columns = [row[1] for row in cursor.fetchall()]
        col_str = ", ".join(columns)
        
        cursor.execute(f"INSERT INTO users ({col_str}) SELECT {col_str} FROM users_old;")
        
        # 4. Verify count
        cursor.execute("SELECT COUNT(*) FROM users;")
        new_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM users_old;")
        old_count = cursor.fetchone()[0]
        
        if new_count == old_count:
            print(f"Migration successful. Copied {new_count} records.")
            # 5. Drop old table
            cursor.execute("DROP TABLE users_old;")
            conn.commit()
            print("Fixed 'users' table constraints.")
        else:
            print("Error: Record count mismatch. Rolling back.")
            conn.rollback()
            # Restore backup logic manually if needed, but we haven't dropped users_old yet so just restore name
            cursor.execute("DROP TABLE users;")
            cursor.execute("ALTER TABLE users_old RENAME TO users;")
            conn.commit()

    except Exception as e:
        print(f"Error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_users_table()
