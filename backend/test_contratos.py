from backend.database import SessionLocal, engine
from backend.models import *
import requests

print('GET /contratos/')
try:
    r = requests.get('http://127.0.0.1:8000/contratos/')
    print(r.status_code, r.headers.get('content-type'))
    print(r.text[:2000])
except Exception as e:
    print('GET failed', e)

print('\nPOST /contratos/ (sem arquivo)')
try:
    data = {
        'numero':'TST-123',
        'cliente':'Cliente Teste',
        'valor':'1000',
        'dataInicio':'2025-08-01',
        'dataFim':'2025-12-01',
        'tipo':'Interno',
        'situacao':'Aprovado',
        'prazoPagamento':'À vista',
        'quantidadeParcelas':'1'
    }
    r = requests.post('http://127.0.0.1:8000/contratos/', data=data)
    print('POST status', r.status_code)
    print(r.text)
except Exception as e:
    print('POST failed', e)

print('\nGET /contratos/ after POST')
try:
    r = requests.get('http://127.0.0.1:8000/contratos/')
    print(r.status_code)
    print(r.text[:2000])
except Exception as e:
    print('GET failed', e)
