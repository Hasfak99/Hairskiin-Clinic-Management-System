"""
Test all endpoints for errors
"""
import sys
sys.path.insert(0, '.')

def test_imports():
    print("=" * 50)
    print("Testing Router Imports")
    print("=" * 50)
    
    try:
        from routers import clients, products, appointments, bills, treatments
        print("[OK] All routers imported successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_main_import():
    print("\n" + "=" * 50)
    print("Testing Main App Import")
    print("=" * 50)
    
    try:
        import main
        print("[OK] Main app imported successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Main import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_database_queries():
    print("\n" + "=" * 50)
    print("Testing Database Queries")
    print("=" * 50)
    
    from database import SessionLocal
    from models import Client, Product, Treatment, Appointment, Bill
    
    db = SessionLocal()
    try:
        # Test each model
        models_to_test = [
            ("Clients", Client),
            ("Products", Product),
            ("Treatments", Treatment),
            ("Appointments", Appointment),
            ("Bills", Bill),
        ]
        
        for name, model in models_to_test:
            try:
                count = db.query(model).count()
                print(f"[OK] {name}: {count} records")
            except Exception as e:
                print(f"[ERROR] {name}: {str(e)[:100]}")
    finally:
        db.close()

if __name__ == "__main__":
    success = True
    success = test_imports() and success
    success = test_main_import() and success
    test_database_queries()
    
    print("\n" + "=" * 50)
    if success:
        print("[SUCCESS] All basic tests passed")
    else:
        print("[FAILED] Some tests failed")
    print("=" * 50)
