"""Retroformata/normaliza documentos CPF/CNPJ para somente dígitos.
Se conectado a Postgres via DATABASE_URL, aplica a normalização lá.
Caso SQLite (DB_PATH disponível), normaliza a tabela local.
"""

from __future__ import annotations
import os, re, sys
from urllib.parse import urlparse

try:
    from database import SQLALCHEMY_DATABASE_URL, DB_PATH  # type: ignore
except Exception:
    SQLALCHEMY_DATABASE_URL = None
    DB_PATH = None

CPF_RE = re.compile(r"^\d{11}$")
CNPJ_RE = re.compile(r"^\d{14}$")


def only_digits(v: str) -> str:
    return re.sub(r"\D+", "", v or "")


def is_doc(v: str) -> bool:
    d = only_digits(v)
    return len(d) in (11, 14)


def normalize(v: str) -> str:
    d = only_digits(v)
    return d if len(d) in (11, 14) else v


def process_sqlite(db_path: str):
    import sqlite3
    conn = sqlite3.connect(db_path)
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
        print(f"[sqlite] Normalizados {changed} registros de {len(rows)}. DB={db_path}")
    finally:
        conn.close()


def process_postgres(url: str):
    from sqlalchemy import create_engine, text
    eng = create_engine(url)
    with eng.begin() as conn:
        res = conn.execute(text("SELECT id, cnpj FROM clientes"))
        rows = res.fetchall()
        changed = 0
        for row in rows:
            cid, doc = row
            if not doc:
                continue
            nd = normalize(doc)
            if nd != doc:
                conn.execute(text("UPDATE clientes SET cnpj=:v WHERE id=:i"), {"v": nd, "i": cid})
                changed += 1
        print(f"[postgres] Normalizados {changed} registros de {len(rows)}.")


def main():
    url = SQLALCHEMY_DATABASE_URL
    if url and url.startswith("postgres"):
        process_postgres(url)
        return
    if DB_PATH and os.path.exists(DB_PATH):
        process_sqlite(DB_PATH)
        return
    print("Nenhum backend suportado encontrado (sem DB_PATH e sem DATABASE_URL postgres).")

if __name__ == "__main__":
    main()
