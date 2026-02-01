
import sqlite3
import os

DB_FILE = "server/hairskiin.db"

def insert_doctor():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Check if exists
        cursor.execute("SELECT user_id FROM users WHERE username = ?", ("te_doctor",))
        if cursor.fetchone():
            print("User te_doctor already exists.")
            return

        print("Inserting te_doctor...")
        # Note: password hash is hardcoded dummy
        sql = """
            INSERT INTO users (username, password_hash, full_name, role, status, branch_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        cursor.execute(sql, ("te_doctor", "dummyhash", "Test Doctor", "doctor", "active", 1))
        conn.commit()
        print("Doctor user inserted.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    insert_doctor()
