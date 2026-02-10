
import sys
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
from auth import get_password_hash

client = TestClient(app)

def setup_test_data(db):
    print("\n=== Setting up Test Data for Roles Visibility ===")
    
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
    dept = db.query(models.Department).filter(models.Department.department_name == "RoleTest Dept").first()
    if not dept:
        dept = models.Department(department_name="RoleTest Dept", description="Desc")
        db.add(dept)
        db.commit()
        db.refresh(dept)

    # 4. Users
    # A. Main Branch Admin (Should see ALL)
    mb_admin = db.query(models.User).filter(models.User.username == "mb_admin_role").first()
    if not mb_admin:
        mb_admin = models.User(
            username="mb_admin_role",
            password_hash=get_password_hash("password"),
            full_name="MB Admin",
            role="admin",
            status="active",
            branch_id=main_branch.branch_id,
            department_id=dept.department_id
        )
        db.add(mb_admin)

    # B. Main Branch Manager (Should see ONLY Main Branch)
    mb_manager = db.query(models.User).filter(models.User.username == "mb_manager_role").first()
    if not mb_manager:
        mb_manager = models.User(
            username="mb_manager_role",
            password_hash=get_password_hash("password"),
            full_name="MB Manager",
            role="manager",
            status="active",
            branch_id=main_branch.branch_id,
            department_id=dept.department_id
        )
        db.add(mb_manager)

    # C. Director (Should see ALL)
    director = db.query(models.User).filter(models.User.username == "director_role").first()
    if not director:
        director = models.User(
            username="director_role",
            password_hash=get_password_hash("password"),
            full_name="Director",
            role="director",
            status="active",
            branch_id=main_branch.branch_id,
            department_id=dept.department_id
        )
        db.add(director)

    db.commit()

    # 5. Treatments
    # Treatment in Main Branch
    t1 = db.query(models.Treatment).filter(models.Treatment.treatment_code == "MB-T1-ROLE").first()
    if not t1:
        t1 = models.Treatment(
            treatment_name="Treatment Main Role",
            treatment_code="MB-T1-ROLE",
            price=100.0,
            duration=30,
            branch_id=main_branch.branch_id,
            department_id=dept.department_id,
            is_active=True
        )
        db.add(t1)
    
    # Treatment in Other Branch
    t2 = db.query(models.Treatment).filter(models.Treatment.treatment_code == "OB-T2-ROLE").first()
    if not t2:
        t2 = models.Treatment(
            treatment_name="Treatment Other Role",
            treatment_code="OB-T2-ROLE",
            price=200.0,
            duration=60,
            branch_id=other_branch.branch_id,
            department_id=dept.department_id,
            is_active=True
        )
        db.add(t2)
        
    db.commit()
    return mb_admin, mb_manager, director

def get_token(username, password):
    response = client.post(
        "/api/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def check_visibility(user_desc, username, should_see_other):
    print(f"\n--- Testing {user_desc} Visibility ---")
    token = get_token(username, "password")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/treatments/?size=100", headers=headers)
    data = response.json()
    items = data.get("items", [])
    
    names = [i['treatment_name'] for i in items if "Role" in i['treatment_name']]
    print(f"Visible Treatments: {names}")
    
    has_other = "Treatment Other Role" in names
    
    if should_see_other:
        if has_other:
            print(f"✅ PASS: {user_desc} CAN see Other Branch treatment (Expected).")
        else:
            print(f"❌ FAIL: {user_desc} CANNOT see Other Branch treatment (Unexpected).")
    else:
        if not has_other:
             print(f"✅ PASS: {user_desc} CANNOT see Other Branch treatment (Expected).")
        else:
            print(f"❌ FAIL: {user_desc} CAN see Other Branch treatment (Unexpected).")

def test_roles():
    db = SessionLocal()
    try:
        setup_test_data(db)
        
        # Test 1: Main Branch Admin -> Should See ALL
        check_visibility("Main Branch Admin", "mb_admin_role", should_see_other=True)
        
        # Test 2: Main Branch Manager -> Should See ONLY Main
        check_visibility("Main Branch Manager", "mb_manager_role", should_see_other=False)
        
        # Test 3: Director -> Should See ALL
        check_visibility("Director", "director_role", should_see_other=True)

    finally:
        db.close()

if __name__ == "__main__":
    test_roles()
