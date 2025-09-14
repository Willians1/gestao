import requests
try:
    r = requests.get('http://127.0.0.1:8000/contratos/')
    print('Status:', r.status_code)
    contratos = r.json()
    print(f'Total de contratos: {len(contratos)}')
    for contrato in contratos:
        print(f"- {contrato['numero']}: {contrato['cliente']} | Data fim: {contrato['dataFim']}")
except Exception as e:
    print('Erro:', e)
