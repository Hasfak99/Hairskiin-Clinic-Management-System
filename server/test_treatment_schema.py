"""
Test treatment schema validation
"""
import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models import Treatment
import schemas

db = SessionLocal()
try:
    treatment = db.query(Treatment).first()
    if treatment:
        print(f"Treatment found: {treatment.treatment_name}")
        print(f"  branch_id: {treatment.branch_id}")
        print(f"  is_active: {treatment.is_active}")
        
        try:
            response = schemas.TreatmentResponse.model_validate(treatment)
            print("\n[OK] Schema validation successful!")
            print(f"Response: {response.model_dump()}")
        except Exception as e:
            print(f"\n[ERROR] Schema validation failed: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("No treatments found in database")
finally:
    db.close()
