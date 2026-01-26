"""
Comprehensive diagnostic script for "Failed to fetch data" errors
"""
import sys
sys.path.insert(0, '.')

print("=" * 60)
print("Hairskiin CRM - Data Fetch Error Diagnosis")
print("=" * 60)

# 1. Check server imports
print("\n[1/6] Checking server imports...")
try:
    import main
    print("  [OK] Server imports successfully")
except Exception as e:
    print(f"  [ERROR] Server import failed: {e}")
    sys.exit(1)

# 2. Check database connection
print("\n[2/6] Checking database connection...")
try:
    from database import SessionLocal, engine
    from models import Client, Product, Treatment, Appointment, Bill, User
    
    db = SessionLocal()
    try:
        # Test queries
        user_count = db.query(User).count()
        client_count = db.query(Client).count()
        treatment_count = db.query(Treatment).count()
        product_count = db.query(Product).count()
        
        print(f"  [OK] Database connected")
        print(f"      Users: {user_count}")
        print(f"      Clients: {client_count}")
        print(f"      Treatments: {treatment_count}")
        print(f"      Products: {product_count}")
    finally:
        db.close()
except Exception as e:
    print(f"  [ERROR] Database connection failed: {e}")
    import traceback
    traceback.print_exc()

# 3. Check authentication
print("\n[3/6] Checking authentication system...")
try:
    from auth import authenticate_user, create_access_token
    from database import SessionLocal
    from models import User
    
    db = SessionLocal()
    try:
        # Test with admin
        user = authenticate_user(db, "admin", "admin123")
        if user:
            print(f"  [OK] Authentication works")
            print(f"      User: {user.username}, Role: {user.role}, Branch ID: {user.branch_id}")
        else:
            print("  [WARNING] Admin authentication failed - check seed.py")
    finally:
        db.close()
except Exception as e:
    print(f"  [ERROR] Authentication check failed: {e}")

# 4. Check all routers
print("\n[4/6] Checking API routers...")
routers_to_check = [
    ('clients', 'clients'),
    ('treatments', 'treatments'),
    ('products', 'products'),
    ('appointments', 'appointments'),
    ('bills', 'bills'),
    ('analytics', 'analytics'),
    ('users', 'users'),
    ('branches', 'branches'),
]

for router_name, router_module in routers_to_check:
    try:
        router = __import__(f'routers.{router_module}', fromlist=[router_module])
        print(f"  [OK] {router_name} router loaded")
    except Exception as e:
        print(f"  [ERROR] {router_name} router failed: {e}")

# 5. Check endpoint accessibility (simulate)
print("\n[5/6] Checking endpoint logic...")
try:
    from database import SessionLocal
    from models import Client, Treatment, Product
    from routers.clients import get_clients
    from routers.treatments import get_treatments
    from routers.products import get_products
    
    db = SessionLocal()
    try:
        # Test queries that endpoints use
        clients = db.query(Client).all()
        treatments = db.query(Treatment).all()
        products = db.query(Product).all()
        
        print(f"  [OK] Endpoint queries work")
        print(f"      Can fetch {len(clients)} clients")
        print(f"      Can fetch {len(treatments)} treatments")
        print(f"      Can fetch {len(products)} products")
    finally:
        db.close()
except Exception as e:
    print(f"  [ERROR] Endpoint logic check failed: {e}")
    import traceback
    traceback.print_exc()

# 6. Check for common issues
print("\n[6/6] Checking for common issues...")
try:
    from database import SessionLocal
    from models import User
    
    db = SessionLocal()
    try:
        users = db.query(User).all()
        users_without_branch = [u for u in users if u.branch_id is None]
        
        if users_without_branch:
            print(f"  [INFO] {len(users_without_branch)} users without branch_id (this is OK)")
        
        # Check if all users are active
        inactive_users = [u for u in users if u.status != 'active']
        if inactive_users:
            print(f"  [WARNING] {len(inactive_users)} inactive users found")
        
        print("  [OK] No critical issues found")
    finally:
        db.close()
except Exception as e:
    print(f"  [ERROR] Issue check failed: {e}")

print("\n" + "=" * 60)
print("Diagnosis Complete")
print("=" * 60)
print("\nNext Steps:")
print("1. Make sure the server is running: python -m uvicorn main:app --reload --port 8000")
print("2. Make sure the frontend is running: cd client && npm run dev")
print("3. Check browser console for specific error messages")
print("4. Verify the proxy in vite.config.js points to http://127.0.0.1:8000")
print("5. Check if you're logged in (token in localStorage)")
