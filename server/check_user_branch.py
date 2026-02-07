from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import SQLALCHEMY_DATABASE_URL
import models

# Setup DB connection
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("--- USERS CHECK ---")
users = db.query(models.User).filter(models.User.username.in_(['hsres', 'hsres2', 'hsdir'])).all()
for u in users:
    print(f"User: {u.username}, Role: {u.role}, BranchID: {u.branch_id}, DeptID: {u.department_id}")
