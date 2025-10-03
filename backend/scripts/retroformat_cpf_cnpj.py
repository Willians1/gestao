"""Normaliza documentos CPF/CNPJ (clientes.cnpj) para somente dígitos em SQLite.
Uso: python backend/scripts/retroformat_cpf_cnpj.py
"""
import re, os, sqlite3
try:
    from database import DB_PATH  # type: ignore
except Exception:
    DB_PATH = None

CPF_RE = re.compile(r"^\d{11}$")
CNPJ_RE = re.compile(r"^\d{14}$")

def only_digits(v: str) -> str:
    return re.sub(r"\D+", "", v or "")

def normalize(v: str) -> str:
    d = only_digits(v)
    return d if len(d) in (11, 14) else v

def main():
    if not DB_PATH or not os.path.exists(DB_PATH):
        print("DB_PATH não disponível ou arquivo inexistente.")
        return
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, cnpj FROM clientes")
        rows = cur.fetchall()
        changed = 0
        for cid, doc in rows:
            if not doc:
                continue
            nd = normalize(doc)
            if nd != doc:
                cur.execute("UPDATE clientes SET cnpj=? WHERE id=?", (nd, cid))
                changed += 1
        conn.commit()
        print(f"Normalizados {changed} registros de {len(rows)}. Arquivo: {DB_PATH}")
    finally:
        conn.close()

if __name__ == '__main__':
    main()
