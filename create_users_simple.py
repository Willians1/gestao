import sqlite3
import hashlib

def hash_password(password: str) -> str:
    """Hash password using SHA-256 to match backend"""
    return hashlib.sha256(password.encode()).hexdigest()

# Conectar ao banco DIRETAMENTE
db_path = 'backend/gestao_obras.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("🔧 CRIAÇÃO SIMPLES DOS USUÁRIOS")
print("==============================")

try:
    # Verificar se a tabela usuarios existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'")
    if not cursor.fetchone():
        print("📋 Criando tabela usuarios...")
        cursor.execute("""
            CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR UNIQUE NOT NULL,
                hashed_password VARCHAR NOT NULL,
                nome VARCHAR NOT NULL,
                email VARCHAR,
                nivel_acesso VARCHAR NOT NULL DEFAULT 'visualizacao',
                ativo BOOLEAN DEFAULT 1
            )
        """)
        conn.commit()
        print("✅ Tabela usuarios criada!")
    
    # Verificar estrutura atual
    cursor.execute("PRAGMA table_info(usuarios)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    print(f"📋 Colunas atuais: {column_names}")
    
    # Limpar usuários existentes
    cursor.execute("DELETE FROM usuarios WHERE username IN ('admin', 'manutencao')")
    
    print("👥 Criando usuários...")
    
    # Criar usuário admin
    admin_hash = hash_password("admin")
    cursor.execute("""
        INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ("admin", admin_hash, "Administrador", "admin@thors.com", "Admin", 1))
    
    # Criar usuário manutenção
    manutencao_hash = hash_password("123456")
    cursor.execute("""
        INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ("manutencao", manutencao_hash, "Usuário Manutenção", "manutencao@thors.com", "Manutenção", 1))
    
    conn.commit()
    
    # Verificar usuários criados
    cursor.execute("SELECT id, username, nivel_acesso, ativo FROM usuarios")
    users = cursor.fetchall()
    
    print(f"✅ Usuários criados ({len(users)}):")
    for user in users:
        status = "🟢" if user[3] else "🔴"
        print(f"   {status} ID:{user[0]} - {user[1]} ({user[2]})")
    
    print(f"\n✅ SUCESSO! Credenciais:")
    print(f"   admin / admin")
    print(f"   manutencao / 123456")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
finally:
    conn.close()

print("\n🔄 Reinicie o backend para aplicar as alterações!")
