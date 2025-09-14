import requests
import json

def test_login():
    url = "http://localhost:8000/login/"
    data = {
        "username": "admin",
        "password": "admin"
    }

    try:
        print("Testando login...")
        response = requests.post(url, json=data, timeout=10)

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            print("✅ LOGIN BEM-SUCEDIDO!")
            return True
        else:
            print("❌ LOGIN FALHOU!")
            return False

    except requests.exceptions.RequestException as e:
        print(f"Erro de conexão: {e}")
        return False

if __name__ == "__main__":
    test_login()
