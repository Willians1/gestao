import sqlite3
import datetime
from database import engine
from models import Base

DB='d:/2engenharia/gestao/backend/gestao_obras.db'
conn=sqlite3.connect(DB)
cur=conn.cursor()
try:
    cur.execute("PRAGMA table_info(contratos);")
    cols=cur.fetchall()
    col_names=[c[1] for c in cols]
    print('contratos columns:', col_names)
    # Se coluna 'numero' não existir, consideramos esquema antigo
    if 'numero' not in col_names:
        ts=datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        newname=f'contratos_old_{ts}'
        print('Renomeando tabela contratos ->', newname)
        cur.execute(f"ALTER TABLE contratos RENAME TO {newname};")
        conn.commit()
        print('Recriando tabelas com Base.metadata.create_all')
        # Recreate tables
        Base.metadata.create_all(bind=engine)
        print('Tabelas recriadas')
    else:
        print('Tabela contratos já com esquema novo; nada a fazer')
except Exception as e:
    print('Erro durante migração:', e)
finally:
    conn.close()
