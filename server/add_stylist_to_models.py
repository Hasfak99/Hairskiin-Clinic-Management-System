from database import engine, Base
from sqlalchemy import text

def add_stylist_column():
    with engine.connect() as conn:
        # Add stylist_id to appointments
        try:
            conn.execute(text("ALTER TABLE appointments ADD COLUMN stylist_id INTEGER REFERENCES users(user_id)"))
            print("Added stylist_id to appointments table")
        except Exception as e:
            print(f"Error adding to appointments: {e}")

        # Add stylist_id to bills
        try:
            conn.execute(text("ALTER TABLE bills ADD COLUMN stylist_id INTEGER REFERENCES users(user_id)"))
            print("Added stylist_id to bills table")
        except Exception as e:
            print(f"Error adding to bills: {e}")
            
        conn.commit()

if __name__ == "__main__":
    add_stylist_column()
