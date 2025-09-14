import sqlite3

conn = sqlite3.connect('gestao_obras.db')
cursor = conn.cursor()

# Verificar colunas da tabela usuarios
cursor.execute('PRAGMA table_info(usuarios)')
columns = cursor.fetchall()

print('Colunas da tabela usuarios:')
for col in columns:
    print(f'  {col[1]}: {col[2]}')

# Verificar se há usuários
cursor.execute('SELECT COUNT(*) FROM usuarios')
count = cursor.fetchone()[0]
print(f'\nTotal de usuários: {count}')

# Listar usuários
if count > 0:
    cursor.execute('SELECT id, username, nome, nivel_acesso, ativo FROM usuarios')
    users = cursor.fetchall()
    print('\nUsuários existentes:')
    for user in users:
        print(f'  ID: {user[0]}, Username: {user[1]}, Nome: {user[2]}, Nivel: {user[3]}, Ativo: {user[4]}')

conn.close()
