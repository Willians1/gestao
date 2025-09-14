import sqlite3
import hashlib
from datetime import datetime

# Conectar ao banco
conn = sqlite3.connect('gestao_obras.db')
cursor = conn.cursor()

print("=== VERIFICANDO E CORRIGINDO TABELA USUARIOS ===")

# Verificar colunas existentes
cursor.execute("PRAGMA table_info(usuarios)")
columns = cursor.fetchall()
print(f"Colunas encontradas: {[col[1] for col in columns]}")

# Adicionar colunas faltantes
missing_columns = []
for col in ['nome', 'email', 'nivel_acesso', 'ativo', 'criado_em', 'criado_por', 'atualizado_em', 'atualizado_por']:
    if col not in [c[1] for c in columns]:
        missing_columns.append(col)

print(f"Colunas faltantes: {missing_columns}")

for col in missing_columns:
    try:
        if col in ['nome', 'email']:
            cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col} TEXT")
        elif col in ['nivel_acesso']:
            cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col} TEXT DEFAULT 'visualizacao'")
        elif col in ['ativo']:
            cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col} BOOLEAN DEFAULT 1")
        elif col in ['criado_em', 'atualizado_em']:
            cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col} DATETIME")
        elif col in ['criado_por', 'atualizado_por']:
            cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col} INTEGER")
        print(f"✓ Adicionada coluna {col}")
    except Exception as e:
        print(f"✗ Erro ao adicionar {col}: {e}")

# Atualizar usuários existentes
cursor.execute("SELECT id, username FROM usuarios")
users = cursor.fetchall()

for user_id, username in users:
    nome = 'Administrador' if username == 'admin' else 'Manutenção' if username == 'manutencao' else username.capitalize()
    email = f"{username}@empresa.com"
    nivel_acesso = 'admin' if username == 'admin' else 'manutencao' if username == 'manutencao' else 'visualizacao'
    now = datetime.now().isoformat()

    cursor.execute("""
        UPDATE usuarios
        SET nome = ?, email = ?, nivel_acesso = ?, ativo = 1, criado_em = ?, atualizado_em = ?
        WHERE id = ?
    """, (nome, email, nivel_acesso, now, now, user_id))

print("✓ Usuários atualizados")

# Verificar usuários finais
cursor.execute("SELECT username, nome, nivel_acesso, ativo FROM usuarios")
final_users = cursor.fetchall()

print("\n=== USUÁRIOS FINAIS ===")
for user in final_users:
    print(f"  {user[0]}: {user[1]} ({user[2]}) - Ativo: {user[3]}")

conn.commit()
conn.close()

print("\n=== CORREÇÃO CONCLUÍDA ===")
