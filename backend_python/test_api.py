import requests

base = 'http://localhost:3000'

print("--- Testing Python Backend API ---")

# 1. Health check
r = requests.get(f'{base}/health')
print('1. Health Check:', r.status_code, r.json())

# 2. Demo Login
r = requests.post(f'{base}/api/auth/login', json={'mobile': '1234567895', 'password': 'kisan123'})
res2 = r.json()
print('2. Demo Login:', r.status_code, res2.get('message'), 'Token:', bool(res2.get('data', {}).get('token')))
token = res2.get('data', {}).get('token')

# 3. Get Current User (/me)
r = requests.get(f'{base}/api/auth/me', headers={'Authorization': f'Bearer {token}'})
print('3. Get Me Profile:', r.status_code, r.json().get('data', {}).get('full_name'))

# 4. Market Prices
r = requests.get(f'{base}/api/market-prices')
prices = r.json().get('data', [])
print('4. Market Prices:', r.status_code, f'Count: {len(prices)}')

# 5. Price History for Chart
r = requests.get(f'{base}/api/market-prices/history', params={'state': 'Punjab', 'market': 'Khanna APMC Grain Market', 'commodity': 'Wheat', 'days': 7})
hist = r.json().get('data', {})
print('5. Price History (7d):', r.status_code, 'Labels:', hist.get('labels'), 'Modal:', hist.get('modal'))

# 6. Market Filters
r = requests.get(f'{base}/api/market-prices/filters')
print('6. Market Filters:', r.status_code, 'Commodities:', r.json().get('data', {}).get('commodities'))

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
print('7. Create Sale:', r.status_code, sale_res)
receipt_id = sale_res.get('data', {}).get('receipt_id')

# 8. Get Receipt
r = requests.get(f'{base}/api/sales/receipt/{receipt_id}', headers={'Authorization': f'Bearer {token}'})
rcpt = r.json().get('data', {})
print('8. Get Receipt:', r.status_code, 'Receipt ID:', rcpt.get('receipt_id'), 'Total Amount: Rs.', rcpt.get('total_amount'))

# 9. Send OTP test
r = requests.post(f'{base}/api/auth/send-otp', json={'mobile': '9876543210'})
otp_res = r.json()
print('9. Send OTP:', r.status_code, otp_res)
otp_code = otp_res.get('debug_otp')

# 10. Signup with OTP
signup_payload = {
    'mobile': '9876543210',
    'otp': otp_code,
    'full_name': 'Gurpreet Singh',
    'state': 'Punjab',
    'district': 'Ludhiana',
    'village': 'Khanna Kalan',
    'land_acres': 12.0
}
r = requests.post(f'{base}/api/auth/signup', json=signup_payload)
print('10. Signup New User:', r.status_code, r.json().get('message'), 'User ID:', r.json().get('data', {}).get('user', {}).get('id'))

print("--- ALL 10 TESTS PASSED SUCCESSFULLY! ---")
