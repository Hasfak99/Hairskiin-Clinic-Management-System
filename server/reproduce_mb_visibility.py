
import sys
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
from auth import get_password_hash

client = TestClient(app)

def setup_test_data(db):
    print("\n=== Setting up Test Data for Main Branch Admin ===")
    
    # 1. Main Branch
    main_branch = db.query(models.Branch).filter(models.Branch.branch_name == "Main Branch").first()
    if not main_branch:
        main_branch = models.Branch(branch_name="Main Branch", address="Loc Main", phone="000", is_active=True)
        db.add(main_branch)
    
    # 2. Other Branch
    other_branch = db.query(models.Branch).filter(models.Branch.branch_name == "Other Branch").first()
    if not other_branch:
        other_branch = models.Branch(branch_name="Other Branch", address="Loc Other", phone="111", is_active=True)
        db.add(other_branch)
        
    db.commit()
    db.refresh(main_branch)
    db.refresh(other_branch)
    
    # 3. Department
    dept = db.query(models.Department).filter(models.Department.department_name == "Test Dept").first()
    if not dept:
        dept = models.Department(department_name="Test Dept", description="Desc")
        db.add(dept)
        db.commit()
        db.refresh(dept)

    # 4. User: Main Branch Admin
    mb_admin = db.query(models.User).filter(models.User.username == "mb_admin_test").first()
    if not mb_admin:
        mb_admin = models.User(
            username="mb_admin_test",
            password_hash=get_password_hash("password"),
            full_name="MB Admin",
            role="admin", # Not Director!
            status="active",
            branch_id=main_branch.branch_id,
            department_id=dept.department_id
        )
        db.add(mb_admin)
        db.commit()

    # 5. Treatments
    # Treatment in Main Branch
    t1 = db.query(models.Treatment).filter(models.Treatment.treatment_code == "MB-T1").first()
    if not t1:
        t1 = models.Treatment(
            treatment_name="Treatment Main",
            treatment_code="MB-T1",
            price=100.0,
            duration=30,
            branch_id=main_branch.branch_id,
            department_id=dept.department_id,
            is_active=True
        )
        db.add(t1)
    
    # Treatment in Other Branch
    t2 = db.query(models.Treatment).filter(models.Treatment.treatment_code == "OB-T2").first()
    if not t2:
        t2 = models.Treatment(
            treatment_name="Treatment Other",
            treatment_code="OB-T2",
            price=200.0,
            duration=60,
            branch_id=other_branch.branch_id,
            department_id=dept.department_id,
            is_active=True
        )
        db.add(t2)
        
    db.commit()
    return mb_admin

def get_token(username, password):
    response = client.post(
        "/api/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def test_visibility():
    db = SessionLocal()
    try:
        setup_test_data(db)
        
        print("\n--- Testing Main Branch Admin Visibility ---")
        token = get_token("mb_admin_test", "password")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/api/treatments/?size=100", headers=headers)
        data = response.json()
        items = data.get("items", [])
        
        names = [i['treatment_name'] for i in items if i['treatment_name'].startswith("Treatment ")]
        print(f"Visible Treatments: {names}")
        
        has_other = "Treatment Other" in names
        if has_other:
            print("✅ PASS: Main Branch Admin CAN see Other Branch treatment.")
        else:
            print("❌ FAIL: Main Branch Admin CANNOT see Other Branch treatment.")

    finally:
        db.close()

if __name__ == "__main__":
    test_visibility()
