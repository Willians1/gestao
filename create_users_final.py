import sqlite3
import hashlib
from datetime import datetime

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

# Conectar ao banco
db_path = 'backend/gestao_obras.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("🔧 Configurando banco de dados...")

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
                ativo BOOLEAN DEFAULT 1,
                criado_em DATETIME,
                criado_por INTEGER,
                atualizado_em DATETIME,
                atualizado_por INTEGER
            )
        """)
        conn.commit()
        print("✅ Tabela usuarios criada!")
    else:
        print("✅ Tabela usuarios já existe!")
    
    # Limpar usuários existentes e recriar
    cursor.execute("DELETE FROM usuarios WHERE username IN ('admin', 'manutencao')")
    
    now = datetime.now().isoformat()
    
    # Criar usuário admin
    admin_pass = hash_password("admin")
    cursor.execute("""
        INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ("admin", admin_pass, "Administrador", "admin@thors.com", "Admin", 1, now, now))
    
    # Criar usuário manutenção  
    manutencao_pass = hash_password("123456")
    cursor.execute("""
        INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ("manutencao", manutencao_pass, "Usuário Manutenção", "manutencao@thors.com", "Manutenção", 1, now, now))
    
    conn.commit()
    
    # Verificar usuários criados
    cursor.execute("SELECT username, nivel_acesso, ativo FROM usuarios")
    users = cursor.fetchall()
    
    print(f"👥 Usuários criados ({len(users)}):")
    for user in users:
        status = "🟢" if user[2] else "🔴"
        print(f"   {status} {user[0]} - {user[1]}")
    
    # Teste de hash
    print(f"\n🔐 Hash de teste:")
    print(f"   admin: {hash_password('admin')}")
    print(f"   123456: {hash_password('123456')}")
    
    print(f"\n✅ Configuração concluída!")
    print(f"🔑 Credenciais:")
    print(f"   admin / admin")
    print(f"   manutencao / 123456")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
finally:
    conn.close()
