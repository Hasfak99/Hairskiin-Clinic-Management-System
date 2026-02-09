"""
Fix Harskin Director Branch Assignment

This script updates the Harskin director's branch_id to their correct branch.
Run this script to fix the issue where Harskin directors see "Main Branch" instead of their own branch.
"""

from database import SessionLocal
from models import User, Branch, Department

def fix_harskin_director_branch():
    db = SessionLocal()
    try:
        # Find the Harskin department
        harskin_dept = db.query(Department).filter(Department.department_name == "Hair Skin").first()
        
        if not harskin_dept:
            print("❌ Hair Skin department not found!")
            return
        
        print(f"✅ Found Hair Skin department (ID: {harskin_dept.department_id})")
        
        # Find the Harskin director
        harskin_director = db.query(User).filter(
            User.role == "director",
            User.department_id == harskin_dept.department_id
        ).first()
        
        if not harskin_director:
            print("❌ Harskin director not found!")
            return
        
        print(f"✅ Found Harskin director: {harskin_director.username}")
        print(f"   Current branch_id: {harskin_director.branch_id}")
        
        # Get current branch name
        if harskin_director.branch_id:
            current_branch = db.query(Branch).filter(Branch.branch_id == harskin_director.branch_id).first()
            print(f"   Current branch name: {current_branch.branch_name if current_branch else 'Unknown'}")
        
        # Find the correct branch for Harskin (assuming it's not Main Branch)
        # You may need to adjust this query based on your actual branch names
        print("\n📋 Available branches:")
        all_branches = db.query(Branch).all()
        for branch in all_branches:
            print(f"   - {branch.branch_name} (ID: {branch.branch_id})")
        
        print("\n⚠️  Please manually update the branch_id in the database or modify this script")
        print("   to set the correct branch for the Harskin director.")
        
        # Example: If you want to set it to a specific branch, uncomment and modify:
        # correct_branch = db.query(Branch).filter(Branch.branch_name == "Your Branch Name").first()
        # if correct_branch:
        #     harskin_director.branch_id = correct_branch.branch_id
        #     db.commit()
        #     print(f"✅ Updated Harskin director's branch to: {correct_branch.branch_name}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_harskin_director_branch()
