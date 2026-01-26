"""
Diagnostic script to identify 500 errors in the API
"""
import sys
from database import SessionLocal, engine
import models
from sqlalchemy import inspect, text

def check_database_structure():
    """Check if database structure matches models"""
    print("=" * 60)
    print("DATABASE STRUCTURE CHECK")
    print("=" * 60)
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n✓ Found {len(tables)} tables: {', '.join(tables)}")
    
    # Check critical tables
    critical_tables = ['clients', 'appointments', 'bills', 'branches']
    for table in critical_tables:
        if table in tables:
            columns = inspector.get_columns(table)
            print(f"\n{table.upper()}:")
            for col in columns:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                print(f"  - {col['name']}: {col['type']} ({nullable})")
        else:
            print(f"\n❌ Missing table: {table}")

def check_branch_data():
    """Check if branches exist"""
    print("\n" + "=" * 60)
    print("BRANCH DATA CHECK")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        branches = db.query(models.Branch).all()
        if branches:
            print(f"\n✓ Found {len(branches)} branch(es):")
            for branch in branches:
                print(f"  - Branch ID: {branch.branch_id}, Name: {branch.branch_name}, Active: {branch.is_active}")
        else:
            print("\n❌ NO BRANCHES FOUND!")
            print("This is likely the cause of 500 errors.")
            print("Recommendation: Create at least one branch in the database.")
    except Exception as e:
        print(f"\n❌ Error querying branches: {e}")
    finally:
        db.close()

def check_required_branch_columns():
    """Check which tables require branch_id"""
    print("\n" + "=" * 60)
    print("BRANCH_ID REQUIREMENT CHECK")
    print("=" * 60)
    
    tables_requiring_branch = ['clients', 'appointments', 'bills', 'treatments', 'products']
    
    db = SessionLocal()
    try:
        for table in tables_requiring_branch:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table} WHERE branch_id IS NULL")).scalar()
            if result > 0:
                print(f"\n❌ {table}: {result} record(s) with NULL branch_id")
            else:
                total = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"\n✓ {table}: All {total} records have branch_id set")
    except Exception as e:
        print(f"\n❌ Error checking branch requirements: {e}")
    finally:
        db.close()

def check_sample_queries():
    """Test sample queries that might be failing"""
    print("\n" + "=" * 60)
    print("SAMPLE QUERY TEST")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Test clients query
        print("\nTesting: GET /api/clients/")
        try:
            clients = db.query(models.Client).limit(5).all()
            print(f"✓ Successfully retrieved {len(clients)} client(s)")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test appointments query
        print("\nTesting: GET /api/appointments/")
        try:
            appointments = db.query(models.Appointment).limit(5).all()
            print(f"✓ Successfully retrieved {len(appointments)} appointment(s)")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test bills query
        print("\nTesting: GET /api/bills/")
        try:
            bills = db.query(models.Bill).limit(5).all()
            print(f"✓ Successfully retrieved {len(bills)} bill(s)")
        except Exception as e:
            print(f"❌ Error: {e}")
            
    except Exception as e:
        print(f"\n❌ General error: {e}")
    finally:
        db.close()

def main():
    print("\n")
    print("🔍 HAIRSKIIN CRM - 500 ERROR DIAGNOSTIC TOOL")
    print("=" * 60)
    
    try:
        check_database_structure()
        check_branch_data()
        check_required_branch_columns()
        check_sample_queries()
        
        print("\n" + "=" * 60)
        print("DIAGNOSTIC COMPLETE")
        print("=" * 60)
        print("\nIf you see ❌ errors above, those are likely causes of 500 errors.")
        print("Most common issue: Missing branches in database.\n")
        
    except Exception as e:
        print(f"\n❌ Fatal error during diagnostics: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
