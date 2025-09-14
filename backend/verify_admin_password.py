import sqlite3
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'gestao_obras.db')

def main():
    if not os.path.exists(DB_PATH):
        print(f'FAIL: Banco não encontrado em {DB_PATH}')
        raise SystemExit(2)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, username, hashed_password, ativo FROM usuarios WHERE username='admin' LIMIT 1")
    row = cur.fetchone()
    if not row:
        print('FAIL: Usuário admin não encontrado')
        raise SystemExit(1)
    _id, username, hashed, ativo = row
    expected = hashlib.sha256('admin'.encode()).hexdigest()
    if hashed == expected and (ativo in (1, True)):
        print('PASS: admin/admin válido e ativo')
        raise SystemExit(0)
    elif hashed != expected:
        print('FAIL: Senha do admin não é "admin"')
        raise SystemExit(3)
    else:
        print('FAIL: Usuário admin está inativo')
        raise SystemExit(4)

if __name__ == '__main__':
    main()
