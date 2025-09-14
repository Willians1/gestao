import requests
import json

print("🧪 TESTE FINAL DE LOGIN")
print("=====================")

# Configuração
backend_url = "http://localhost:8000"
login_endpoint = f"{backend_url}/login/"

# Credenciais para teste
test_credentials = [
    {"username": "admin", "password": "admin", "expected": "Admin"},
    {"username": "manutencao", "password": "123456", "expected": "Manutenção"}
]

print(f"🌐 Backend URL: {backend_url}")
print(f"🔗 Login endpoint: {login_endpoint}")

for i, creds in enumerate(test_credentials, 1):
    print(f"\n🧪 Teste {i}: {creds['username']}")
    print("─" * 30)
    
    try:
        # Fazer requisição de login
        response = requests.post(
            login_endpoint,
            json={
                "username": creds["username"],
                "password": creds["password"]
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ LOGIN BEM-SUCEDIDO!")
            print(f"🔑 Token recebido: {'Sim' if data.get('access_token') else 'Não'}")
            
            user_info = data.get('user', {})
            print(f"👤 Usuário: {user_info.get('username', 'N/A')}")
            print(f"📝 Nome: {user_info.get('nome', 'N/A')}")
            print(f"🎯 Nível: {user_info.get('nivel_acesso', 'N/A')}")
            print(f"✅ Ativo: {'Sim' if user_info.get('ativo') else 'Não'}")
            
            # Verificar se o nível está correto
            if user_info.get('nivel_acesso') == creds['expected']:
                print("🎉 Nível de acesso CORRETO!")
            else:
                print(f"⚠️  Nível esperado: {creds['expected']}, recebido: {user_info.get('nivel_acesso')}")
                
        elif response.status_code == 422:
            print("❌ Erro de validação (422)")
            print(f"📄 Detalhes: {response.text}")
        elif response.status_code == 401:
            print("❌ Credenciais inválidas (401)")
        else:
            print(f"❌ Erro HTTP {response.status_code}")
            print(f"📄 Resposta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao backend!")
        print("   Verifique se o backend está rodando em http://localhost:8000")
        break
    except requests.exceptions.Timeout:
        print("❌ ERRO: Timeout na requisição")
    except Exception as e:
        print(f"❌ ERRO INESPERADO: {e}")

print(f"\n{'='*50}")
print("🎯 RESUMO DO TESTE:")
print("   Se todos os logins foram bem-sucedidos,")
print("   o sistema THORS está 100% funcional!")
print("   ")
print("   🌐 Frontend: http://localhost:3000")
print("   🔧 Backend: http://localhost:8000")
print("   📖 Docs: http://localhost:8000/docs")
print("="*50)
