"""
Fix: Add qr_code column that failed during migration
"""
import sqlite3

def fix_qr_code_column():
    conn = sqlite3.connect('hairskiin.db')
    cursor = conn.cursor()
    
    print("=" * 60)
    print("FIXING QR_CODE COLUMN")
    print("=" * 60)
    
    try:
        # Add qr_code column without UNIQUE constraint
        print("\nAdding qr_code column to clients table...")
        cursor.execute("ALTER TABLE clients ADD COLUMN qr_code VARCHAR(100)")
        conn.commit()
        print("✓ Successfully added qr_code column")
        
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("⊘ qr_code column already exists")
        else:
            print(f"✗ Error: {e}")
    
    print("\n" + "=" * 60)
    print("FIX COMPLETE!")
    print("=" * 60)
    print("\nNow restart your server:")
    print("  python -m uvicorn main:app --reload --port 8000")
    
    conn.close()

if __name__ == "__main__":
    fix_qr_code_column()
