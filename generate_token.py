
import sys
import os
from datetime import timedelta

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'server')))

from server.auth import create_access_token
from server.schemas import TokenData
from server.database import get_db

# We assume 'admin' exists (verified by debug_roles.py)
# We don't need to verify password if we just sign a token for 'admin' user
# mocking authentication

if __name__ == "__main__":
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": "admin", "role": "admin", "branch_id": 1},
        expires_delta=access_token_expires
    )
    # print(f"TOKEN: {access_token}") # Don't print, use it
    
    import urllib.request
    import json
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("\n--- Making Request to /api/users/ ---")
    url = "http://localhost:8000/api/users/?page=1&size=20"
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            print(f"Status Code: {response.status}")
            print("Response Text:")
            print(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Request failed with Status: {e.code}")
        print("Response Text:")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Request failed: {e}")
