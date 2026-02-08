import sys
import os

# Add server directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from database import SessionLocal
from models import User

db = SessionLocal()
user = db.query(User).filter(User.username == 'hsdoc').first()
if user:
    print(f"User: {user.username}, Role: '{user.role}'")
else:
    print("User 'hsdoc' not found")
