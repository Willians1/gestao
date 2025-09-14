import requests
import json

# Teste do endpoint de upload específico para valor_materiais
url = "http://localhost:8000/upload_valor_materiais"

with open("teste_valor_materiais.xlsx", "rb") as f:
    files = {"file": ("teste_valor_materiais.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    
    response = requests.post(url, files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
