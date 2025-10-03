"""Retroformata todos os campos clientes.cnpj armazenados apenas com dígitos
para o formato padrão:
 - CPF: ###.###.###-##
 - CNPJ: ##.###.###/####-##
Ignora valores já formatados (contendo pontuação) e tamanhos diferentes de 11/14.
Uso:
  python backend/scripts/retroformat_cpf_cnpj.py
"""
from __future__ import annotations
import sqlite3, re, os
try:
    from database import DB_PATH  # type: ignore
except Exception:
    DB_PATH = None

CPF_RE = re.compile(r'^\d{11}$')
CNPJ_RE = re.compile(r'^\d{14}$')


def fmt(value: str) -> str:
    if CPF_RE.match(value):
        return f"{value[0:3]}.{value[3:6]}.{value[6:9]}-{value[9:11]}"
    if CNPJ_RE.match(value):
        return f"{value[0:2]}.{value[2:5]}.{value[5:8]}/{value[8:12]}-{value[12:14]}"
    return value


def main():
    if not DB_PATH:
        print('DB_PATH indisponível (não SQLite).')
        return
    if not os.path.exists(DB_PATH):
        print('Arquivo não encontrado:', DB_PATH)
        return
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute('SELECT id, cnpj FROM clientes')
        rows = cur.fetchall()
        changed = 0
        for cid, doc in rows:
            if not doc:
                continue
            if any(ch in doc for ch in '.-/' ):
                continue  # já formatado
            new_val = fmt(doc)
            if new_val != doc:
                cur.execute('UPDATE clientes SET cnpj=? WHERE id=?', (new_val, cid))
                changed += 1
        conn.commit()
        print(f'Reformatados {changed} registros. Total verificado: {len(rows)}. DB: {DB_PATH}')
    finally:
        conn.close()

if __name__ == '__main__':
    main()
