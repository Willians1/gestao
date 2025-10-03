import json
import os
import sqlite3
import argparse

try:
    from database import DB_PATH  # type: ignore
except Exception:
    DB_PATH = None


def upsert_clients(rows: list[dict]):
    if not DB_PATH:
        raise RuntimeError("DB_PATH não disponível (backend não está usando SQLite)")
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        # Garante colunas esperadas (adiciona se faltarem)
        cur.execute("PRAGMA table_info(clientes)")
        cols = {r[1] for r in cur.fetchall()}
        # Nome, cnpj, email, contato, endereco são usados na UI
        needed = {"id", "nome", "cnpj", "email", "contato", "endereco"}
        missing = needed - cols
        if missing:
            # Adiciona colunas faltantes com tipos padrão
            for c in missing:
                if c == "id":
                    continue
                try:
                    cur.execute(f"ALTER TABLE clientes ADD COLUMN {c} TEXT")
                except Exception:
                    pass
            conn.commit()

        # Upsert por id
        sql = (
            "INSERT INTO clientes (id, nome, cnpj, email, contato, endereco) "
            "VALUES (?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET "
            "nome=excluded.nome, cnpj=excluded.cnpj, email=excluded.email, "
            "contato=excluded.contato, endereco=excluded.endereco"
        )
        for r in rows:
            cur.execute(
                sql,
                (
                    int(r.get("id")),
                    r.get("nome") or "",
                    r.get("cnpj") or None,
                    r.get("email") or None,
                    r.get("contato") or None,
                    r.get("endereco") or None,
                ),
            )
        conn.commit()
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", required=True, help="Caminho do arquivo JSON com lista de clientes")
    args = ap.parse_args()
    with open(args.json, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("JSON inválido: esperado array de clientes")
    upsert_clients(data)
    print(f"Sincronizados {len(data)} clientes para {DB_PATH}")


if __name__ == "__main__":
    main()
