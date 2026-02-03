import requests

def test_single_bill():
    try:
        # 1. Login
        login_resp = requests.post('http://localhost:8000/api/auth/login', data={
            'username': 'admin', 'password': 'password123'
        })
        token = login_resp.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Get Bill 14
        resp = requests.get('http://localhost:8000/api/bills/14', headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Bill 14 Status: {data.get('edit_request_status')}")
            print(f"Full Data: {data}")
        else:
            print(f"Failed: {resp.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_single_bill()
