import requests
r=requests.get('http://127.0.0.1:8000/contratos/')
print('status', r.status_code)
print(r.json())
