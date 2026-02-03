import requests

def test_api():
    try:
        # 1. Login to get token
        login_resp = requests.post('http://localhost:8000/api/auth/login', data={
            'username': 'admin', 'password': 'password123'
        })
        if login_resp.status_code != 200:
            print(f"Login failed: {login_resp.text}")
            return
        
        token = login_resp.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Get Pending Bills
        resp = requests.get('http://localhost:8000/api/bills/?edit_request_status=pending', headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Pending Bills from API: {data['total']}")
            for item in data['items']:
                print(f" - Bill #{item['bill_id']} Status: {item['edit_request_status']}")
        else:
            print(f"Failed to get bills: {resp.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
