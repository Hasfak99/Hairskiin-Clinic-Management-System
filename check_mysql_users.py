
from sqlalchemy import create_engine, text
import sys
import os

# Configuration from updated database.py
MYSQL_USER = "root"
MYSQL_PASSWORD = ""
MYSQL_HOST = "localhost"
MYSQL_PORT = "3306"
MYSQL_DATABASE = "hairskiin_crm"

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"

def check_mysql():
    print(f"Connecting to MySQL: {SQLALCHEMY_DATABASE_URL}")
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        with engine.connect() as conn:
            print("Connected!")
            
            # Check users table schema/content
            print("\n--- Users Table Columns ---")
            result = conn.execute(text("DESCRIBE users;"))
            for row in result:
                print(row)
                
            print("\n--- Distinct Roles ---")
            result = conn.execute(text("SELECT DISTINCT role FROM users;"))
            for row in result:
                print(f"Role: '{row[0]}'")
                
            print("\n--- Invalid Roles ---")
            result = conn.execute(text("SELECT user_id, username, role FROM users WHERE role IS NULL OR role = '';"))
            rows = result.fetchall()
            if rows:
                print(f"Found {len(rows)} users with invalid roles:")
                for r in rows:
                    print(r)
            else:
                print("No users with empty roles found.")
                
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    check_mysql()
