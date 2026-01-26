"""
Test script to reproduce 500 errors from API endpoints
"""
import sys
import traceback
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

# Create a test client
client = TestClient(app)

def test_health():
    """Test health endpoint (should work)"""
    print("\n=== Testing /api/health ===")
    response = client.get("/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_login():
    """Test login to get token"""
    print("\n=== Testing /api/auth/login ===")
    
    # First check if any users exist
    db = SessionLocal()
    users = db.query(models.User).all()
    print(f"Users in database: {len(users)}")
    
    if not users:
        print("❌ No users found! Creating test admin...")
        from auth import get_password_hash
        test_user = models.User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            full_name="Test Admin",
            role="admin",
            status="active"
        )
        db.add(test_user)
        db.commit()
        print("✓ Created test admin (username: admin, password: admin123)")
    else:
        for user in users:
            print(f"  - {user.username} ({user.role})")
    
    db.close()
    
    # Try to login
    response = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"✓ Login successful, got token")
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_clients_endpoint(token):
    """Test GET /api/clients/ - this is failing with 500"""
    print("\n=== Testing /api/clients/ ===")
    
    # Check database first
    db = SessionLocal()
    clients_count = db.query(models.Client).count()
    branches_count = db.query(models.Branch).count()
    print(f"Clients in DB: {clients_count}")
    print(f"Branches in DB: {branches_count}")
    
    if branches_count == 0:
        print("⚠️ WARNING: No branches exist! This will cause issues.")
        print("Creating default branch...")
        branch = models.Branch(
            branch_name="Main Branch",
            address="Default Location",
            phone="0000000000",
            is_active=True
        )
        db.add(branch)
        db.commit()
        db.refresh(branch)
        print(f"✓ Created branch ID: {branch.branch_id}")
    
    db.close()
    
    # Now test the endpoint
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = client.get("/api/clients/", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Success! Retrieved {len(data)} clients")
        else:
            print(f"❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        traceback.print_exc()

def test_appointments_endpoint(token):
    """Test GET /api/appointments/"""
    print("\n=== Testing /api/appointments/ ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = client.get("/api/appointments/", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Success! Retrieved {len(data)} appointments")
        else:
            print(f"❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        traceback.print_exc()

def test_bills_endpoint(token):
    """Test GET /api/bills/"""
    print("\n=== Testing /api/bills/ ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = client.get("/api/bills/", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Success! Retrieved {len(data)} bills")
        else:
            print(f"❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        traceback.print_exc()

def main():
    print("=" * 60)
    print("🔍 API 500 ERROR DIAGNOSTIC TEST")
    print("=" * 60)
    
    try:
        # Test health
        if not test_health():
            print("\n❌ Health check failed! Server not working.")
            return
        
        # Test login
        token = test_login()
        if not token:
            print("\n❌ Could not get auth token!")
            return
        
        # Test the failing endpoints
        test_clients_endpoint(token)
        test_appointments_endpoint(token)
        test_bills_endpoint(token)
        
        print("\n" + "=" * 60)
        print("✓ DIAGNOSTIC COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
