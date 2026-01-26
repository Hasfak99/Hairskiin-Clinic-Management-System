"""
Diagnose API endpoint issues
"""
import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models import User
from auth import create_access_token, authenticate_user
from datetime import timedelta

def test_authentication():
    print("=" * 50)
    print("Testing Authentication")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # Test with admin user
        user = authenticate_user(db, "admin", "admin123")
        if user:
            print(f"[OK] Admin authentication works")
            print(f"     User: {user.username}, Role: {user.role}, Branch ID: {user.branch_id}")
            
            # Create a test token
            token_data = {
                "sub": user.username,
                "role": user.role
            }
            if user.branch_id is not None:
                token_data["branch_id"] = user.branch_id
            
            token = create_access_token(data=token_data)
            print(f"[OK] Token created: {token[:50]}...")
            return token
        else:
            print("[ERROR] Admin authentication failed")
            return None
    finally:
        db.close()

def test_endpoint_queries():
    print("\n" + "=" * 50)
    print("Testing Endpoint Queries (without auth)")
    print("=" * 50)
    
    from models import Client, Product, Treatment, Appointment, Bill
    
    db = SessionLocal()
    try:
        endpoints = [
            ("Clients", Client, "branch_id"),
            ("Products", Product, "branch_id"),
            ("Treatments", Treatment, "branch_id"),
            ("Appointments", Appointment, "branch_id"),
            ("Bills", Bill, "branch_id"),
        ]
        
        for name, model, filter_field in endpoints:
            try:
                # Test query without filter
                count_all = db.query(model).count()
                print(f"[OK] {name}: {count_all} total records")
                
                # Test query with None branch_id filter
                count_none = db.query(model).filter(
                    (getattr(model, filter_field) == None) | 
                    (getattr(model, filter_field).is_(None))
                ).count()
                print(f"     {count_none} records with branch_id=None")
                
                # Test query with a specific branch_id (if any exist)
                from sqlalchemy import or_
                count_with_branch = db.query(model).filter(
                    getattr(model, filter_field).isnot(None)
                ).count()
                print(f"     {count_with_branch} records with branch_id set")
                
            except Exception as e:
                print(f"[ERROR] {name}: {str(e)[:100]}")
    finally:
        db.close()

def check_common_issues():
    print("\n" + "=" * 50)
    print("Checking Common Issues")
    print("=" * 50)
    
    # Check if server is likely running
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', 8000))
    sock.close()
    
    if result == 0:
        print("[OK] Port 8000 is open (server might be running)")
    else:
        print("[WARNING] Port 8000 is closed (server might not be running)")
        print("          Start server with: python -m uvicorn main:app --reload --port 8000")
    
    # Check database file
    import os
    if os.path.exists('hairskiin.db'):
        size = os.path.getsize('hairskiin.db')
        print(f"[OK] Database file exists ({size} bytes)")
    else:
        print("[ERROR] Database file not found")

if __name__ == "__main__":
    token = test_authentication()
    test_endpoint_queries()
    check_common_issues()
    
    print("\n" + "=" * 50)
    print("Diagnosis Complete")
    print("=" * 50)
    print("\nIf endpoints are failing, check:")
    print("1. Server is running on http://localhost:8000")
    print("2. Frontend proxy is configured correctly")
    print("3. User is authenticated (token in localStorage)")
    print("4. Check browser console for specific error messages")
