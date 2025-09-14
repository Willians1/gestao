from backend.database import SessionLocal, engine
from backend.models import *
import requests
url='http://127.0.0.1:8000/contratos/'
files={'arquivo': ('teste.txt', b'conteudo de teste')}
data={
    'numero':'TST-123',
    'cliente':'Cliente Teste',
    'valor':'1000.50',
    'dataInicio':'2025-08-22',
    'dataFim':'2025-12-31',
    'tipo':'Interno',
    'situacao':'Aprovado',
    'prazoPagamento':'À vista',
    'quantidadeParcelas':'1'
}
try:
    r=requests.post(url, data=data, files=files)
    print('status', r.status_code)
    try:
        print(r.json())
    except Exception as e:
        print('resp text', r.text)
except Exception as e:
    print('erro', e)
