from sqlalchemy.orm import Session
from database import SessionLocal
from models import Client, Appointment, User, Treatment, Branch, Department

def log(msg, f):
    f.write(msg + "\n")
    print(msg)

with open("db_dump.txt", "w", encoding="utf-8") as f:
    try:
        db: Session = SessionLocal()
        
        log("--- USERS ---", f)
        users = db.query(User).all()
        for u in users:
            log(f"User: {u.username}, Role: {u.role}, Branch: {u.branch_id}, Dept: {u.department_id}", f)

        log("\n--- CLIENTS ---", f)
        clients = db.query(Client).all()
        for c in clients:
            log(f"Client: {c.name} (ID: {c.client_id}), Branch: {c.branch_id}, Dept: {c.department_id}", f)

        log("\n--- APPOINTMENTS ---", f)
        appts = db.query(Appointment).all()
        for a in appts:
            log(f"Appt ID: {a.appointment_id}, Status: {a.status}, Branch: {a.branch_id}, Dept: {a.department_id}", f)

        db.close()
    except Exception as e:
        log(f"Error: {e}", f)
