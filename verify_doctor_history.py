
import urllib.request
import json
from datetime import timedelta
# Import utils from generate_token.py context if possible, but easier to just inline the token generation logic
# matching what we did in generate_token.py
# Wait, I can just reuse generate_token.py logic or import from it if it was a module. 
# But generate_token.py is a script.
# I'll Copy-Paste the relevant parts for a standalone test.

from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "hairskiin-crm-secret-key-change-in-production-2024"
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def test_history():
    # 1. Generate Token for 'doc' (one of the fixed users) or 'te_doctor'
    # We saw 'doc', 'doc1' etc in the DB. Let's use 'doc'
    token = create_access_token({"sub": "doc", "role": "doctor", "branch_id": 1})
    
    # 2. Call the new endpoint
    url = "http://127.0.0.1:8000/api/analytics/doctor-treatments"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status Code: {response.getcode()}")
            data = json.loads(response.read().decode())
            print("Response Data (First 2 items):")
            print(json.dumps(data[:2], indent=2))
            print(f"Total History Items: {len(data)}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_history()
