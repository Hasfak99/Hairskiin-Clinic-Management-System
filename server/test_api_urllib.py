import urllib.request
import json
import urllib.parse

def test_api_urllib():
    try:
        # 1. Login
        url = 'http://localhost:8000/api/auth/login'
        data = urllib.parse.urlencode({'username': 'admin', 'password': 'password123'}).encode()
        req = urllib.request.Request(url, data=data, method='POST')
        with urllib.request.urlopen(req) as response:
            login_resp = json.loads(response.read().decode())
            token = login_resp['access_token']

        # 2. Get Bill 14
        url = 'http://localhost:8000/api/bills/14'
        req = urllib.request.Request(url, method='GET')
        req.add_header('Authorization', f'Bearer {token}')
        
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"Bill 14 Edit Status: {data.get('edit_request_status')}")
            # print(f"Full Data: {data}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api_urllib()
