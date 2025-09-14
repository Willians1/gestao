import os
import requests
from time import perf_counter

base_url = os.getenv("API_URL", "http://127.0.0.1:8000").rstrip('/')
URL = f"{base_url}/login/"
DATA = {"username": "admin", "password": "admin"}
TIMEOUT = 5  # segundos

print("🧪 Testando login via API...")
print(f"URL: {URL}")

# Preflight: health check para falhar rápido se a API não estiver pronta
try:
    h = requests.get(f"{base_url}/healthz", timeout=2)
    print(f"🩺 Healthz: {h.status_code}")
except Exception as e:
    print(f"⏱️ API indisponível (healthz): {e}")
    raise SystemExit(2)

start = perf_counter()
try:
    response = requests.post(URL, json=DATA, timeout=TIMEOUT)
    elapsed = perf_counter() - start
    print(f"📊 Status: {response.status_code} em {elapsed:.3f}s")
    if response.status_code == 200:
        result = response.json()
        print("✅ Login bem-sucedido!")
        print(f"🔑 Token (50): {result.get('access_token','')[:50]}...")
        user = result.get('user', {})
        print(f"👤 Usuário: {user}")
    else:
        print("❌ Erro no login:")
        print(f"📄 Resposta: {response.text[:300]}")
except requests.exceptions.Timeout:
    elapsed = perf_counter() - start
    print(f"⏱️ Timeout após {elapsed:.3f}s (limite {TIMEOUT}s)")
except requests.exceptions.ConnectionError as e:
    elapsed = perf_counter() - start
    print(f"❌ Conexão falhou em {elapsed:.3f}s: {e}")
except Exception as e:
    elapsed = perf_counter() - start
    print(f"❌ Erro inesperado em {elapsed:.3f}s: {e}")
