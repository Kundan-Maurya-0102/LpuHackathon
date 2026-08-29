import requests

base = 'http://localhost:3000'

print("--- Testing KisanSetu 24/7 Python Backend API ---")

# 1. Health check
r = requests.get(f'{base}/health')
print('1. Health Check:', r.status_code, r.json())
assert r.status_code == 200, "Health check failed"

# 2. Demo Login (Seeded farmer: 9876543210 / kisan123)
r = requests.post(f'{base}/api/auth/login', json={'mobile': '9876543210', 'password': 'kisan123'})
res2 = r.json()
print('2. Demo Login:', r.status_code, res2.get('message'), 'Token:', bool(res2.get('data', {}).get('token')))
assert r.status_code == 200, f"Login failed: {res2}"
token = res2.get('data', {}).get('token')

# 3. Get Current User (/me)
r = requests.get(f'{base}/api/auth/me', headers={'Authorization': f'Bearer {token}'})
print('3. Get Me Profile:', r.status_code, r.json().get('data', {}).get('full_name'))
assert r.status_code == 200, "Get me failed"

# 4. Market Prices
r = requests.get(f'{base}/api/market-prices')
prices = r.json().get('data', [])
print('4. Market Prices:', r.status_code, f'Count: {len(prices)}')
assert r.status_code == 200 and len(prices) > 0, "Market prices failed"

# 5. Price History for Chart
r = requests.get(f'{base}/api/market-prices/history', params={'state': 'Punjab', 'market': 'Khanna APMC Grain Market', 'commodity': 'Wheat', 'days': 7})
hist = r.json().get('data', {})
print('5. Price History (7d):', r.status_code, 'Labels:', hist.get('labels'), 'Modal:', hist.get('modal'))
assert r.status_code == 200, "History failed"

# 6. Market Filters
r = requests.get(f'{base}/api/market-prices/filters')
print('6. Market Filters:', r.status_code, 'Commodities:', r.json().get('data', {}).get('commodities'))
assert r.status_code == 200, "Filters failed"

# 7. Create Sale
sale_payload = {
    'commodity': 'Wheat',
    'variety': 'FAQ HD-2967',
    'quantity': 40.0,
    'unit': 'Quintal',
    'price_per_unit': 2510.0,
    'mandi_name': 'Khanna APMC Grain Market',
    'buyer_name': 'Amritsar Food Traders'
}
r = requests.post(f'{base}/api/sales', json=sale_payload, headers={'Authorization': f'Bearer {token}'})
sale_res = r.json()
print('7. Create Sale:', r.status_code, sale_res.get('message'))
assert r.status_code == 200, "Create sale failed"
receipt_id = sale_res.get('data', {}).get('receipt_id')

# 8. Get Receipt
r = requests.get(f'{base}/api/sales/receipt/{receipt_id}', headers={'Authorization': f'Bearer {token}'})
rcpt = r.json().get('data', {})
print('8. Get Receipt:', r.status_code, 'Receipt ID:', rcpt.get('receipt_id'), 'Net Amount: Rs.', rcpt.get('net_amount'))
assert r.status_code == 200, "Get receipt failed"

# 9. Send OTP test
test_mobile = "9988776655"
r = requests.post(f'{base}/api/auth/send-otp', json={'mobile': test_mobile})
otp_res = r.json()
print('9. Send OTP:', r.status_code, otp_res.get('message'))
assert r.status_code == 200, "Send OTP failed"
otp_code = otp_res.get('debug_otp')

# 10. Signup / Verify OTP with new User
signup_payload = {
    'mobile': test_mobile,
    'otp': otp_code,
    'full_name': 'Harpreet Singh',
    'state': 'Punjab',
    'district': 'Ludhiana',
    'village': 'Khanna Kalan',
    'land_acres': 15.0
}
r = requests.post(f'{base}/api/auth/signup', json=signup_payload)
print('10. Signup New User:', r.status_code, r.json().get('message'), 'User ID:', r.json().get('data', {}).get('user', {}).get('id'))
assert r.status_code == 200, "Signup failed"

# 11. Multilingual Guide endpoint
r = requests.get(f'{base}/api/guide?lang=hi')
print('11. Guide API (Hindi):', r.status_code, r.json().get('data', {}).get('welcome_title'))
assert r.status_code == 200, "Guide API failed"

print("\n🎉 ALL 11 TESTS PASSED SUCCESSFULLY! SERVER RUNNING 24/7 WITHOUT ERRORS!")
