"""
Fix for ResponseValidationError: branch_id is None
This script will find any clients (and other models) with NULL branch_id and assign them to the default branch.
"""
import sys
import sqlite3

def fix_null_branch_ids():
    conn = sqlite3.connect('hairskiin.db')
    cursor = conn.cursor()
    
    print("=" * 60)
    print("FIXING NULL BRANCH_ID VALUES")
    print("=" * 60)
    
    # 1. Ensure we have a default branch
    cursor.execute("SELECT branch_id FROM branches LIMIT 1")
    result = cursor.fetchone()
    
    if not result:
        print("Creating default branch...")
        cursor.execute("""
            INSERT INTO branches (branch_name, address, phone, email, is_active, created_at, updated_at)
            VALUES ('Main Branch', 'Default Location', '0000000000', 'info@example.com', 1, datetime('now'), datetime('now'))
        """)
        conn.commit()
        default_branch_id = cursor.lastrowid
        print(f"Created default branch ID: {default_branch_id}")
    else:
        default_branch_id = result[0]
        print(f"Using default branch ID: {default_branch_id}")

    # 2. Fix Clients
    print("\nChecking Clients table...")
    cursor.execute("SELECT count(*) FROM clients WHERE branch_id IS NULL")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Found {count} clients with NULL branch_id. Fixing...")
        cursor.execute("UPDATE clients SET branch_id = ? WHERE branch_id IS NULL", (default_branch_id,))
        conn.commit()
        print("✓ Fixed clients")
    else:
        print("✓ Clients table OK")

    # 3. Fix Appointments
    print("\nChecking Appointments table...")
    cursor.execute("SELECT count(*) FROM appointments WHERE branch_id IS NULL")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Found {count} appointments with NULL branch_id. Fixing...")
        cursor.execute("UPDATE appointments SET branch_id = ? WHERE branch_id IS NULL", (default_branch_id,))
        conn.commit()
        print("✓ Fixed appointments")
    else:
        print("✓ Appointments table OK")
        
    # 4. Fix Treatments
    print("\nChecking Treatments table...")
    cursor.execute("SELECT count(*) FROM treatments WHERE branch_id IS NULL")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Found {count} treatments with NULL branch_id. Fixing...")
        cursor.execute("UPDATE treatments SET branch_id = ? WHERE branch_id IS NULL", (default_branch_id,))
        conn.commit()
        print("✓ Fixed treatments")
    else:
        print("✓ Treatments table OK")

    # 5. Fix Products
    print("\nChecking Products table...")
    cursor.execute("SELECT count(*) FROM products WHERE branch_id IS NULL")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Found {count} products with NULL branch_id. Fixing...")
        cursor.execute("UPDATE products SET branch_id = ? WHERE branch_id IS NULL", (default_branch_id,))
        conn.commit()
        print("✓ Fixed products")
    else:
        print("✓ Products table OK")

    # 6. Fix Bills
    print("\nChecking Bills table...")
    cursor.execute("SELECT count(*) FROM bills WHERE branch_id IS NULL")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Found {count} bills with NULL branch_id. Fixing...")
        cursor.execute("UPDATE bills SET branch_id = ? WHERE branch_id IS NULL", (default_branch_id,))
        conn.commit()
        print("✓ Fixed bills")
    else:
        print("✓ Bills table OK")

    # 7. Fix Expenses
    print("\nChecking Expenses table...")
    cursor.execute("SELECT count(*) FROM expenses WHERE branch_id IS NULL")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Found {count} expenses with NULL branch_id. Fixing...")
        cursor.execute("UPDATE expenses SET branch_id = ? WHERE branch_id IS NULL", (default_branch_id,))
        conn.commit()
        print("✓ Fixed expenses")
    else:
        print("✓ Expenses table OK")

    print("\n" + "=" * 60)
    print("FIX COMPLETE!")
    print("=" * 60)
    print("Please restart your server to see changes.")
    
    conn.close()

if __name__ == "__main__":
    fix_null_branch_ids()
