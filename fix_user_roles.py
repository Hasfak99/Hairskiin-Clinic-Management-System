
import sqlite3
import os

DB_FILE = "server/hairskiin.db"

def fix_roles():
    if not os.path.exists(DB_FILE):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Find users with empty or invalid roles
        print("--- Checking for invalid roles ---")
        cursor.execute("SELECT user_id, username, role FROM users WHERE role IS NULL OR role = ''")
        invalid_users = cursor.fetchall()
        
        if not invalid_users:
            print("No users with empty roles found.")
        else:
            print(f"Found {len(invalid_users)} users with empty/invalid roles:")
            for u in invalid_users:
                print(f"ID: {u[0]}, Username: {u[1]}, Role: '{u[2]}'")
            
            # Fix them
            print("Fixing roles to 'receptionist'...")
            cursor.execute("UPDATE users SET role = 'receptionist' WHERE role IS NULL OR role = ''")
            conn.commit()
            print("Roles updated.")
            
        # Verify
        cursor.execute("SELECT DISTINCT role FROM users")
        roles = cursor.fetchall()
        print("Current distinct roles:", [r[0] for r in roles])

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_roles()
