import requests
import json

# Testar PUT para atualizar contrato
url = 'http://127.0.0.1:8000/contratos/1'
data = {
    'numero': 'TST-123-ATUALIZADO',
    'cliente': 'Cliente Teste Atualizado',
    'valor': 2000.75,
    'dataInicio': '2025-08-22',
    'dataFim': '2025-12-31',
    'tipo': 'Prestador de Serviço',
    'situacao': 'Aguardando aprovação',
    'prazoPagamento': '30 DD',
    'quantidadeParcelas': '3'
}

try:
    r = requests.put(url, json=data)
    print('Status:', r.status_code)
    if r.status_code == 200:
        print('Contrato atualizado:', r.json())
    else:
        print('Erro:', r.text)
except Exception as e:
    print('Erro na requisição:', e)
