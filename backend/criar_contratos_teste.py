import requests
import datetime

# Criar contratos com diferentes datas para testar o contador
contratos_teste = [
    {
        'numero': 'TESTE-VERDE',
        'cliente': 'Cliente Verde',
        'valor': '1000.00',
        'dataInicio': '2025-08-22',
        'dataFim': (datetime.date.today() + datetime.timedelta(days=100)).isoformat(),  # 100 dias (verde)
        'tipo': 'Interno',
        'situacao': 'Aprovado',
        'prazoPagamento': 'À vista',
        'quantidadeParcelas': '1'
    },
    {
        'numero': 'TESTE-AMARELO',
        'cliente': 'Cliente Amarelo',
        'valor': '2000.00',
        'dataInicio': '2025-08-22',
        'dataFim': (datetime.date.today() + datetime.timedelta(days=30)).isoformat(),  # 30 dias (amarelo)
        'tipo': 'Prestador de Serviço',
        'situacao': 'Aguardando aprovação',
        'prazoPagamento': '30 DD',
        'quantidadeParcelas': '2'
    },
    {
        'numero': 'TESTE-VERMELHO',
        'cliente': 'Cliente Vermelho',
        'valor': '3000.00',
        'dataInicio': '2025-08-22',
        'dataFim': (datetime.date.today() + datetime.timedelta(days=7)).isoformat(),  # 7 dias (vermelho)
        'tipo': 'Interno',
        'situacao': 'Aprovado',
        'prazoPagamento': 'À vista',
        'quantidadeParcelas': '1'
    }
]

url = 'http://127.0.0.1:8000/contratos/'

for contrato in contratos_teste:
    try:
        # Criar FormData
        formdata = {}
        for key, value in contrato.items():
            formdata[key] = value
        
        r = requests.post(url, data=formdata)
        print(f"Contrato {contrato['numero']}: Status {r.status_code}")
        if r.status_code == 200:
            print(f"  Criado com sucesso - Data fim: {contrato['dataFim']}")
        else:
            print(f"  Erro: {r.text}")
    except Exception as e:
        print(f"Erro ao criar {contrato['numero']}: {e}")
