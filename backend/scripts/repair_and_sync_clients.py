"""Script de reparo completo dos clientes locais.

Funcionalidades:
1. Detecta DB_PATH utilizado pelo backend.
2. Remove clientes dummy (nome começando por 'Cliente ' e sem CNPJ/email/contato/endereco)
   se existirem clientes reais no JSON de origem.
3. Faz upsert dos clientes reais (id, nome, cnpj, email, contato, endereco).
4. Opcional: aplica normalização de CNPJ (remove não dígitos) e mantém versão formatada.
5. Exibe resumo final do total de clientes e alguns exemplos.

Uso:
  python backend/scripts/repair_and_sync_clients.py --json caminho/export_clientes.json [--purge-dummies]
"""
from __future__ import annotations
import argparse, json, os, re, sqlite3

try:
    from database import DB_PATH  # type: ignore
except Exception:
    DB_PATH = None

CNPJ_RE = re.compile(r'\D+')

def only_digits(s: str | None) -> str | None:
    if not s:
        return None
    return re.sub(r'\D+', '', s)

def format_cnpj(cnpj_digits: str | None) -> str | None:
    if not cnpj_digits:
        return None
    if len(cnpj_digits) != 14:
        return cnpj_digits  # leave as is if size unexpected
    return f"{cnpj_digits[0:2]}.{cnpj_digits[2:5]}.{cnpj_digits[5:8]}/{cnpj_digits[8:12]}-{cnpj_digits[12:14]}"

def ensure_table_columns(cur):
    cur.execute("PRAGMA table_info(clientes)")
    cols = {r[1] for r in cur.fetchall()}
    needed = {"id", "nome", "cnpj", "email", "contato", "endereco"}
    for col in needed - cols:
        if col == 'id':
            continue
        try:
            cur.execute(f"ALTER TABLE clientes ADD COLUMN {col} TEXT")
        except Exception:
            pass

def purge_dummy_clients(cur):
    # Remove clientes gerados por seed (Cliente 01.., sem dados de contato)
    cur.execute("DELETE FROM clientes WHERE nome LIKE 'Cliente %' AND (email IS NULL OR email='') AND (contato IS NULL OR contato='') AND (endereco IS NULL OR endereco='')")

def upsert_clients(cur, rows, normalize_cnpj=True):
    sql = ("INSERT INTO clientes (id, nome, cnpj, email, contato, endereco) "
           "VALUES (?, ?, ?, ?, ?, ?) "
           "ON CONFLICT(id) DO UPDATE SET nome=excluded.nome, cnpj=excluded.cnpj, "
           "email=excluded.email, contato=excluded.contato, endereco=excluded.endereco")
    for r in rows:
        cid = int(r.get('id'))
        nome = r.get('nome') or ''
        cnpj_raw = r.get('cnpj') or r.get('CNPJ') or None
        if normalize_cnpj and cnpj_raw:
            digits = only_digits(cnpj_raw)
            # Armazena sem máscara, mas se quiser mascarado troque para format_cnpj(digits)
            cnpj_store = digits
        else:
            cnpj_store = cnpj_raw
        cur.execute(sql, (
            cid,
            nome,
            cnpj_store,
            r.get('email') or r.get('Email') or None,
            r.get('contato') or r.get('Contato') or None,
            r.get('endereco') or r.get('Endereco') or r.get('Endereço') or None,
        ))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--json', required=True, help='Arquivo JSON exportado do Render com lista de clientes')
    ap.add_argument('--purge-dummies', action='store_true', help='Remove clientes seed artificiais antes do upsert')
    args = ap.parse_args()

    if not DB_PATH:
        raise SystemExit('DB_PATH indisponível (backend não está em modo SQLite)')
    with open(args.json, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise SystemExit('JSON inválido: esperado array de objetos clientes')

    os.makedirs(os.path.dirname(DB_PATH) or '.', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        ensure_table_columns(cur)
        if args.purge_dummies:
            purge_dummy_clients(cur)
        upsert_clients(cur, data)
        conn.commit()
        # Resumo
        cur.execute('SELECT COUNT(*) FROM clientes')
        total = cur.fetchone()[0]
        cur.execute('SELECT id, nome, cnpj, email FROM clientes ORDER BY id LIMIT 10')
        sample = cur.fetchall()
        print(f"Sincronizados {len(data)} registros. Total agora: {total}.")
        for row in sample:
            print('  ->', row)
        print('DB_PATH:', DB_PATH)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
