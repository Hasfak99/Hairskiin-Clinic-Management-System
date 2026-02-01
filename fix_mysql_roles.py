
from sqlalchemy import create_engine, text

# Configuration
MYSQL_USER = "root"
MYSQL_PASSWORD = ""
MYSQL_HOST = "localhost"
MYSQL_PORT = "3306"
MYSQL_DATABASE = "hairskiin_crm"

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"

def fix_mysql():
    print(f"Connecting to MySQL: {SQLALCHEMY_DATABASE_URL}")
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        with engine.connect() as conn:
            # 1. Check Column Type
            print("Checking role column type...")
            result = conn.execute(text("SHOW COLUMNS FROM users LIKE 'role'"))
            row = result.fetchone()
            print(f"Column info: {row}")
            type_str = row[1].decode('utf-8') if isinstance(row[1], bytes) else str(row[1])
            
            # If ENUM and missing doctor, fix it
            if "enum" in type_str.lower() and "doctor" not in type_str.lower():
                print("Adding 'doctor' to ENUM...")
                # Extract existing values
                # e.g. enum('admin','manager') -> 'admin','manager'
                current_values = type_str[5:-1]
                new_definition = f"ENUM({current_values}, 'doctor')"
                conn.execute(text(f"ALTER TABLE users MODIFY COLUMN role {new_definition}"))
                conn.commit()
                print("ENUM updated.")
            
            # 2. Update invalid roles
            print("Updating empty roles to 'doctor'...")
            result = conn.execute(text("UPDATE users SET role='doctor' WHERE role IS NULL OR role = ''"))
            print(f"Updated {result.rowcount} rows.")
            conn.commit()
            
            # 3. Verify
            result = conn.execute(text("SELECT user_id, username, role FROM users WHERE username LIKE 'doc%';"))
            for r in result:
                print(r)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_mysql()
