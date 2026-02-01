
import sqlite3
import os

DB_FILE = "server/hairskiin.db"

def check_roles():
    if not os.path.exists(DB_FILE):
        print(f"Database not found at {DB_FILE}")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    print("--- Distinct Roles ---")
    try:
        cursor.execute("SELECT DISTINCT role FROM users")
        roles = cursor.fetchall()
        for role in roles:
            print(f"Role: '{role[0]}'")
            
        print("\n--- All Users ---")
        cursor.execute("SELECT user_id, username, role, branch_id, department_id FROM users")
        users = cursor.fetchall()
        for u in users:
            print(f"ID: {u[0]}, User: {u[1]}, Role: {u[2]}, Branch: {u[3]}, Dept: {u[4]}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_roles()
