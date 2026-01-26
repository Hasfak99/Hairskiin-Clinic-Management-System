"""
Check all tables for missing branch_id columns
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import text
from database import engine, SessionLocal
from models import Treatment, Product, Client, Appointment, Bill, Expense

def check_tables():
    print("=" * 50)
    print("Checking Database Tables")
    print("=" * 50)
    
    tables_to_check = [
        ('treatments', Treatment),
        ('products', Product),
        ('clients', Client),
        ('appointments', Appointment),
        ('bills', Bill),
        ('expenses', Expense),
    ]
    
    db = SessionLocal()
    try:
        for table_name, model_class in tables_to_check:
            print(f"\nChecking {table_name}...")
            try:
                # Check if table exists and has branch_id column
                with engine.connect() as conn:
                    result = conn.execute(text(f"PRAGMA table_info({table_name})"))
                    columns = {row[1]: row[2] for row in result.fetchall()}
                    
                    if 'branch_id' not in columns:
                        print(f"  [ERROR] Missing branch_id column")
                    else:
                        print(f"  [OK] branch_id column exists")
                        
                        # Try to query
                        count = db.query(model_class).count()
                        print(f"  [OK] Table has {count} records")
            except Exception as e:
                print(f"  [ERROR] {str(e)[:100]}")
    finally:
        db.close()
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    check_tables()
