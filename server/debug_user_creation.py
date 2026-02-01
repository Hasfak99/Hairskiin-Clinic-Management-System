
import sqlite3
from sqlalchemy import create_engine, text

DB_URL = "sqlite:///./hairskiin.db"

def check_schema():
    conn = sqlite3.connect("hairskiin.db")
    cursor = conn.cursor()
    
    print("--- Users Table Schema ---")
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users';")
    schema = cursor.fetchone()
    if schema:
        print(schema[0])
    else:
        print("Users table not found!")
    conn.close()

def try_insert():
    print("\n--- Attempting Insert ---")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Try raw insert to see if DB rejects it
            try:
                conn.execute(text("""
                    INSERT INTO users (username, password_hash, role, status, branch_id) 
                    VALUES ('test_doctor', 'hash', 'doctor', 'active', 1)
                """))
                print("Insert SUCCESS! (Rollback)")
                conn.rollback() # Don't actually keep it
            except Exception as e:
                print(f"Insert FAILED: {e}")
                
    except Exception as outer:
        print(f"Connection failed: {outer}")

if __name__ == "__main__":
    check_schema()
    try_insert()
