import sqlite3
import json

conn = sqlite3.connect('server/hairskiin.db')
cursor = conn.cursor()

print("\n=== DATABASE STATUS ===\n")

# Check branches
cursor.execute('SELECT COUNT(*) FROM branches')
branch_count = cursor.fetchone()[0]
print(f"Branches: {branch_count}")

if branch_count > 0:
    cursor.execute('SELECT branch_id, branch_name, is_active FROM branches')
    branches = cursor.fetchall()
    for b in branches:
        print(f"  - Branch {b[0]}: {b[1]} (Active: {b[2]})")

# Check clients
cursor.execute('SELECT COUNT(*) FROM clients')
client_count = cursor.fetchone()[0]
print(f"\nClients: {client_count}")

# Check appointments
cursor.execute('SELECT COUNT(*) FROM appointments')
apt_count = cursor.fetchone()[0]
print(f"Appointments: {apt_count}")

# Check bills
cursor.execute('SELECT COUNT(*) FROM bills')
bill_count = cursor.fetchone()[0]
print(f"Bills: {bill_count}")

# Check for NULL branch_ids
print("\n=== NULL BRANCH_ID CHECK ===\n")
for table in ['clients', 'appointments', 'bills']:
    cursor.execute(f'SELECT COUNT(*) FROM {table} WHERE branch_id IS NULL')
    null_count = cursor.fetchone()[0]
    if null_count > 0:
        print(f"⚠️ {table}: {null_count} records with NULL branch_id")
    else:
        print(f"✓ {table}: All records have branch_id")

conn.close()
