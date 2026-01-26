"""
Database migration script to add missing branch_id column to users table
"""
import sys
import os
sys.path.insert(0, '.')

from sqlalchemy import text
from database import engine, Base
import models

def migrate_database():
    """Add missing branch_id column to users table if it doesn't exist"""
    print("=" * 50)
    print("Hairskiin CRM - Database Migration")
    print("=" * 50)
    
    # First, ensure all tables exist (create new ones)
    print("\n[1/2] Creating/updating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[OK] Tables created/updated")
    except Exception as e:
        print(f"[ERROR] Error creating tables: {e}")
        return False
    
    # Check if branch_id column exists in users table
    print("\n[2/2] Checking for missing columns...")
    with engine.connect() as conn:
        try:
            # Check if branch_id column exists
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'branch_id' not in columns:
                print("  -> Adding branch_id column to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN branch_id INTEGER"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_branch_id ON users(branch_id)"))
                conn.commit()
                print("  [OK] Added branch_id column")
            else:
                print("  [OK] branch_id column already exists")
            
            # Check if branches table exists and create if needed
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='branches'"))
            if not result.fetchone():
                print("  -> Creating branches table...")
                # This will be handled by create_all, but let's ensure it
                Base.metadata.create_all(bind=engine)
                print("  [OK] Branches table created")
            else:
                print("  [OK] Branches table exists")
            
            print("\n[SUCCESS] Migration completed successfully!")
            return True
            
        except Exception as e:
            print(f"[ERROR] Migration error: {e}")
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
