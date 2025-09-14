import sqlite3
p='d:/2engenharia/gestao/backend/gestao_obras.db'
conn=sqlite3.connect(p)
cur=conn.cursor()
try:
    cur.execute("PRAGMA table_info(contratos);")
    cols=cur.fetchall()
    print('col_count', len(cols))
    for c in cols:
        print(c)
    cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='contratos'")
    print('create sql:')
    print(cur.fetchone())
except Exception as e:
    print('Erro:', e)
finally:
    conn.close()
