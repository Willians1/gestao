import sqlite3
p='d:/2engenharia/gestao/backend/gestao_obras.db'
conn=sqlite3.connect(p)
cur=conn.cursor()
try:
    cur.execute('SELECT id, numero, cliente, arquivo, arquivo_upload_id FROM contratos ORDER BY id DESC LIMIT 10')
    rows=cur.fetchall()
    print('Encontrados', len(rows), 'registros:')
    for r in rows:
        print(r)
except Exception as e:
    print('Erro:', e)
finally:
    conn.close()
