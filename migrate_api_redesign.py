"""
Migration script to add new fields for API redesign
Adds: QR codes, walk-in appointments, global products/treatments
"""
import sqlite3
import sys

def migrate_database():
    """Add new columns to existing database"""
    conn = sqlite3.connect('server/hairskiin.db')
    cursor = conn.cursor()
    
    print("=" * 60)
    print("DATABASE MIGRATION - API REDESIGN")
    print("=" * 60)
    
    migrations = []
    
    # Client table migrations
    print("\n1. Migrating 'clients' table...")
    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN client_type VARCHAR(20) DEFAULT 'registered'")
        migrations.append("✓ Added clients.client_type")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ clients.client_type already exists")
        else:
            migrations.append(f"✗ clients.client_type: {e}")
    
    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN qr_code VARCHAR(100) UNIQUE")
        migrations.append("✓ Added clients.qr_code")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ clients.qr_code already exists")
        else:
            migrations.append(f"✗ clients.qr_code: {e}")
    
    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN registered_from_appointment INTEGER")
        migrations.append("✓ Added clients.registered_from_appointment")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ clients.registered_from_appointment already exists")
        else:
            migrations.append(f"✗ clients.registered_from_appointment: {e}")
    
    # Appointment table migrations
    print("\n2. Migrating 'appointments' table...")
    try:
        cursor.execute("ALTER TABLE appointments ADD COLUMN guest_name VARCHAR(100)")
        migrations.append("✓ Added appointments.guest_name")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ appointments.guest_name already exists")
        else:
            migrations.append(f"✗ appointments.guest_name: {e}")
    
    try:
        cursor.execute("ALTER TABLE appointments ADD COLUMN guest_phone VARCHAR(20)")
        migrations.append("✓ Added appointments.guest_phone")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ appointments.guest_phone already exists")
        else:
            migrations.append(f"✗ appointments.guest_phone: {e}")
    
    try:
        cursor.execute("ALTER TABLE appointments ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'")
        migrations.append("✓ Added appointments.payment_status")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ appointments.payment_status already exists")
        else:
            migrations.append(f"✗ appointments.payment_status: {e}")
    
    try:
        cursor.execute("ALTER TABLE appointments ADD COLUMN converted_to_client BOOLEAN DEFAULT 0")
        migrations.append("✓ Added appointments.converted_to_client")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ appointments.converted_to_client already exists")
        else:
            migrations.append(f"✗ appointments.converted_to_client: {e}")
    
    # Treatment table migrations
    print("\n3. Migrating 'treatments' table...")
    try:
        cursor.execute("ALTER TABLE treatments ADD COLUMN is_global BOOLEAN DEFAULT 0")
        migrations.append("✓ Added treatments.is_global")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ treatments.is_global already exists")
        else:
            migrations.append(f"✗ treatments.is_global: {e}")
    
    # Product table migrations
    print("\n4. Migrating 'products' table...")
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN is_global BOOLEAN DEFAULT 0")
        migrations.append("✓ Added products.is_global")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            migrations.append("⊘ products.is_global already exists")
        else:
            migrations.append(f"✗ products.is_global: {e}")
    
    # Commit changes
    conn.commit()
    
    # Print results
    print("\n" + "=" * 60)
    print("MIGRATION RESULTS")
    print("=" * 60)
    for migration in migrations:
        print(migration)
    
    print("\n" + "=" * 60)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. The new fields are now available in the database")
    
    conn.close()

if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
