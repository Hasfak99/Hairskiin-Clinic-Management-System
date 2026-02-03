from sqlalchemy.orm import Session
from database import SessionLocal
import models
import sys

def check_client_deletion(client_id):
    db = SessionLocal()
    try:
        client = db.query(models.Client).filter(models.Client.client_id == client_id).first()
        if not client:
            print(f"Client {client_id} not found")
            return

        print(f"Attempting to delete client: {client.name} (ID: {client.client_id})")

        # Check existing relations
        appointments = db.query(models.Appointment).filter(models.Appointment.client_id == client.client_id).all()
        print(f"Appointments count: {len(appointments)}")
        
        bills = db.query(models.Bill).filter(models.Bill.client_id == client.client_id).all()
        print(f"Bills count: {len(bills)}")

        db.delete(client)
        db.commit()
        print("Deletion successful")
        
    except Exception as e:
        print("Deletion failed!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    check_client_deletion(1)
