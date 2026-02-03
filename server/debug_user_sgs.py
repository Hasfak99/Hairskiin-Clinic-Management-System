from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Client

with open("user_debug.txt", "w") as f:
    db = SessionLocal()
    user = db.query(User).filter(User.username == "sgs").first()
    if user:
        f.write(f"User: {user.username}\nRole: {user.role}\nBranch ID: {user.branch_id}\nDept ID: {user.department_id}\n")
    else:
        f.write("User 'sgs' not found.\n")
    
    clients = db.query(Client).all()
    f.write(f"\nTotal Clients: {len(clients)}\n")
    for c in clients:
        f.write(f"Client: {c.name}, Br: {c.branch_id}, Dept: {c.department_id}, Created: {c.created_at}\n")
    db.close()
