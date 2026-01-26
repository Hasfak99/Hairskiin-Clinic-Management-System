"""
Fix for 500 errors - Ensures default branch exists and updates routers
Run this script to fix the database and API issues
"""
import sys
sys.path.insert(0, '.')

from database import SessionLocal
import models
from sqlalchemy.exc import IntegrityError

def ensure_default_branch():
    """Ensure at least one branch exists"""
    db = SessionLocal()
    try:
        # Check if any branches exist
        branch_count = db.query(models.Branch).count()
        
        if branch_count == 0:
            print("❌ No branches found! Creating default branch...")
            default_branch = models.Branch(
                branch_name="Main Branch",
                address="Default Location",
                phone="0000000000",
                email="info@hairskiin.com",
                is_active=True
            )
            db.add(default_branch)
            db.commit()
            db.refresh(default_branch)
            print(f"✓ Created default branch (ID: {default_branch.branch_id})")
            return default_branch.branch_id
        else:
            print(f"✓ Found {branch_count} branch(es)")
            active_branch = db.query(models.Branch).filter(models.Branch.is_active == True).first()
            if active_branch:
                print(f"✓ Active branch: {active_branch.branch_name} (ID: {active_branch.branch_id})")
                return active_branch.branch_id
            else:
                print("⚠️ No active branches found!")
                return None
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def fix_null_branch_ids(default_branch_id):
    """Fix any records with NULL branch_id"""
    if not default_branch_id:
        print("⚠️ Cannot fix NULL branch_ids without a default branch")
        return
    
    db = SessionLocal()
    try:
        tables = [
            (models.Client, 'clients'),
            (models.Appointment, 'appointments'),
            (models.Bill, 'bills'),
            (models.Treatment, 'treatments'),
            (models.Product, 'products')
        ]
        
        for model, name in tables:
            null_records = db.query(model).filter(model.branch_id == None).all()
            if null_records:
                print(f"\n⚠️ Fixing {len(null_records)} {name} with NULL branch_id...")
                for record in null_records:
                    record.branch_id = default_branch_id
                db.commit()
                print(f"✓ Fixed {name}")
            else:
                count = db.query(model).count()
                print(f"✓ {name}: All {count} records have valid branch_id")
    
    except Exception as e:
        print(f"❌ Error fixing NULL branch_ids: {e}")
        db.rollback()
    finally:
        db.close()

def verify_database():
    """Verify database is in good state"""
    db = SessionLocal()
    try:
        print("\n" + "=" * 60)
        print("DATABASE VERIFICATION")
        print("=" * 60)
        
        # Count records
        branches = db.query(models.Branch).count()
        clients = db.query(models.Client).count()
        appointments = db.query(models.Appointment).count()
        bills = db.query(models.Bill).count()
        users = db.query(models.User).count()
        
        print(f"\n✓ Branches: {branches}")
        print(f"✓ Clients: {clients}")
        print(f"✓ Appointments: {appointments}")
        print(f"✓ Bills: {bills}")
        print(f"✓ Users: {users}")
        
        if users == 0:
            print("\n⚠️ WARNING: No users found!")
            print("Run: python seed.py to create default admin user")
        
    except Exception as e:
        print(f"❌ Error verifying database: {e}")
    finally:
        db.close()

def main():
    print("=" * 60)
    print("🔧 FIXING 500 API ERRORS")
    print("=" * 60)
    
    print("\nStep 1: Ensure default branch exists...")
    default_branch_id = ensure_default_branch()
    
    if default_branch_id:
        print(f"\nStep 2: Fix NULL branch_ids (using branch {default_branch_id})...")
        fix_null_branch_ids(default_branch_id)
    
    print("\nStep 3: Verify database state...")
    verify_database()
    
    print("\n" + "=" * 60)
    print("✅ FIX COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Refresh your browser")
    print("3. The 500 errors should be resolved")
    print("\nIf you still see errors, check the server logs for details.")

if __name__ == "__main__":
    main()
