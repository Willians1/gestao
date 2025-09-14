import sqlite3
from passlib.hash import bcrypt

# Conectar ao banco
conn = sqlite3.connect('backend/gestao_obras.db')
cursor = conn.cursor()

# Criar hash das senhas
admin_hash = bcrypt.hash('admin')
manutencao_hash = bcrypt.hash('123456')

# Inserir usuários
try:
    cursor.execute("""
        INSERT OR REPLACE INTO usuarios 
        (username, hashed_password, nome, email, nivel_acesso, ativo) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, ('admin', admin_hash, 'Administrador', 'admin@thors.com', 'Admin', True))
    
    cursor.execute("""
        INSERT OR REPLACE INTO usuarios 
        (username, hashed_password, nome, email, nivel_acesso, ativo) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, ('manutencao', manutencao_hash, 'Usuário Manutenção', 'manutencao@thors.com', 'Manutenção', True))
    
    conn.commit()
    print("✅ Usuários criados com sucesso!")
    
    # Verificar usuários
    cursor.execute("SELECT username, nivel_acesso FROM usuarios")
    users = cursor.fetchall()
    print("📋 Usuários cadastrados:")
    for user in users:
        print(f"  - {user[0]} ({user[1]})")
        
except Exception as e:
    print(f"❌ Erro: {e}")
finally:
    conn.close()
