#!/usr/bin/env python3
import requests
import json

def test_login():
    url = "http://localhost:8000/login/"
    data = {
        "username": "admin",
        "password": "admin"
    }

    try:
        response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            result = response.json()
            if "access_token" in result:
                print("✅ LOGIN SUCESSO!")
                print(f"Token: {result['access_token'][:50]}...")
                return True
            else:
                print("❌ Resposta sem token")
        else:
            print("❌ Login falhou")

    except Exception as e:
        print(f"❌ Erro: {e}")

    return False

if __name__ == "__main__":
    test_login()
