"""
Database migration script to add missing branch_id columns to all tables
"""
import sys
import os
sys.path.insert(0, '.')

from sqlalchemy import text
from database import engine, Base
import models

def migrate_database():
    """Add missing branch_id columns to all tables"""
    print("=" * 50)
    print("Hairskiin CRM - Database Migration")
    print("=" * 50)
    
    # First, ensure all tables exist (create new ones)
    print("\n[1/3] Creating/updating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[OK] Tables created/updated")
    except Exception as e:
        print(f"[ERROR] Error creating tables: {e}")
        return False
    
    # Tables that need branch_id column
    tables_to_migrate = [
        ('users', 'branch_id', 'INTEGER'),
        ('treatments', 'branch_id', 'INTEGER'),
        ('products', 'branch_id', 'INTEGER'),
        ('clients', 'branch_id', 'INTEGER'),
        ('appointments', 'branch_id', 'INTEGER'),
        ('bills', 'branch_id', 'INTEGER'),
        ('expenses', 'branch_id', 'INTEGER'),
    ]
    
    print("\n[2/3] Checking for missing columns...")
    with engine.connect() as conn:
        try:
            for table_name, column_name, column_type in tables_to_migrate:
                # Check if table exists
                result = conn.execute(text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'"))
                if not result.fetchone():
                    print(f"  -> Table '{table_name}' does not exist, skipping...")
                    continue
                
                # Check if column exists
                result = conn.execute(text(f"PRAGMA table_info({table_name})"))
                columns = [row[1] for row in result.fetchall()]
                
                if column_name not in columns:
                    print(f"  -> Adding {column_name} column to {table_name} table...")
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
                    
                    # Create index if it's a foreign key
                    if column_name == 'branch_id':
                        try:
                            conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table_name}_{column_name} ON {table_name}({column_name})"))
                        except:
                            pass  # Index might already exist
                    
                    conn.commit()
                    print(f"  [OK] Added {column_name} column to {table_name}")
                else:
                    print(f"  [OK] {column_name} column already exists in {table_name}")
            
            # Check if branches table exists
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='branches'"))
            if not result.fetchone():
                print("  -> Creating branches table...")
                Base.metadata.create_all(bind=engine)
                print("  [OK] Branches table created")
            else:
                print("  [OK] Branches table exists")
            
            print("\n[3/3] Verifying migration...")
            # Verify all columns exist
            all_ok = True
            for table_name, column_name, _ in tables_to_migrate:
                result = conn.execute(text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'"))
                if result.fetchone():
                    result = conn.execute(text(f"PRAGMA table_info({table_name})"))
                    columns = [row[1] for row in result.fetchall()]
                    if column_name not in columns:
                        print(f"  [ERROR] {column_name} still missing from {table_name}")
                        all_ok = False
            
            if all_ok:
                print("  [OK] All migrations verified successfully!")
            
            print("\n[SUCCESS] Migration completed successfully!")
            return True
            
        except Exception as e:
            print(f"[ERROR] Migration error: {e}")
            import traceback
            traceback.print_exc()
            conn.rollback()
            return False

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("\nYou can now run:")
        print("  python seed.py")
        print("  python -m uvicorn main:app --reload --port 8000")
    else:
        print("\nMigration failed. Please check the error above.")
    print("=" * 50)
