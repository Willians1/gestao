import json
import sys
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8000'


def do_login():
    data = json.dumps({"username": "admin", "password": "admin"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE}/login/", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    token = payload.get("access_token")
    if not token:
        raise RuntimeError("Login não retornou token")
    print("[OK] Login - token prefix:", token[:20])
    return token


def get_uploads(token: str, entidade: str | None = None):
    url = f"{BASE}/uploads"
    if entidade:
        url += f"?entidade={entidade}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode("utf-8")
    print("[OK] List uploads (len):", len(body))
    return body


def upload_valor_materiais(token: str):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    csv_content = "descricao,valor\nParafuso,1.23\n"
    parts = []
    parts.append(f"--{boundary}\r\n")
    parts.append('Content-Disposition: form-data; name="file"; filename="teste.csv"\r\n')
    parts.append('Content-Type: text/csv\r\n\r\n')
    parts.append(csv_content)
    parts.append(f"\r\n--{boundary}--\r\n")
    body = ''.join(parts).encode('utf-8')
    req = urllib.request.Request(f"{BASE}/upload_valor_materiais", data=body, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = resp.read().decode("utf-8")
        print("[OK] Upload valor_materiais:", payload)
        return True
    except urllib.error.HTTPError as e:
        print("[FAIL] Upload HTTP:", e.code, e.read().decode("utf-8"))
        return False
    except Exception as e:
        print("[FAIL] Upload erro:", e)
        return False


def main():
    try:
        token = do_login()
        get_uploads(token)
        upload_valor_materiais(token)
        get_uploads(token, "valor_materiais")
        print("[DONE] Smoke test concluído.")
    except Exception as e:
        print("[ERROR] Smoke test falhou:", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
