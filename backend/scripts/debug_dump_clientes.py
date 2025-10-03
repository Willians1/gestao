"""Dump rápido da tabela clientes para diagnóstico.
Uso:
  python backend/scripts/debug_dump_clientes.py [--limit 25]
"""
from database import DB_PATH
import sqlite3, argparse, os


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--limit', type=int, default=25)
    args = ap.parse_args()
    if not DB_PATH:
        print('DB_PATH não identificado (não é SQLite).')
        return
    if not os.path.exists(DB_PATH):
        print('Arquivo não encontrado:', DB_PATH)
        return
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM clientes')
        total = cur.fetchone()[0]
        print('Total clientes:', total)
        cur.execute('SELECT id, nome, cnpj, email, contato, endereco FROM clientes ORDER BY id LIMIT ?', (args.limit,))
        for row in cur.fetchall():
            print(row)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
