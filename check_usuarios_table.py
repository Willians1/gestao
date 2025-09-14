import sqlite3

# Conectar ao banco
conn = sqlite3.connect('backend/gestao_obras.db')
cursor = conn.cursor()

# Verificar se a tabela usuarios existe
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios';")
result = cursor.fetchone()

if result:
    print("Tabela 'usuarios' existe!")
    
    # Verificar estrutura da tabela
    cursor.execute("PRAGMA table_info(usuarios);")
    columns = cursor.fetchall()
    
    print("\nEstrutura da tabela usuarios:")
    for col in columns:
        print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULL'}")
    
    # Verificar se há dados
    cursor.execute("SELECT COUNT(*) FROM usuarios;")
    count = cursor.fetchone()[0]
    print(f"\nNúmero de usuários na tabela: {count}")
    
    if count > 0:
        cursor.execute("SELECT username, nivel_acesso FROM usuarios;")
        users = cursor.fetchall()
        print("\nUsuários existentes:")
        for user in users:
            print(f"  {user[0]} - {user[1]}")
else:
    print("Tabela 'usuarios' NÃO existe!")

conn.close()
