import sqlite3
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Conectar ao banco
conn = sqlite3.connect('backend/gestao_obras.db')
cursor = conn.cursor()

print("🔍 VERIFICANDO BANCO DE DADOS")
print("============================")

try:
    # Verificar se a tabela existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'")
    if cursor.fetchone():
        print("✅ Tabela usuarios existe")
        
        # Verificar estrutura
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = cursor.fetchall()
        print(f"📋 Colunas: {[col[1] for col in columns]}")
        
        # Verificar usuários
        cursor.execute("SELECT username, nivel_acesso FROM usuarios")
        users = cursor.fetchall()
        print(f"👥 Usuários ({len(users)}):")
        for user in users:
            print(f"   - {user[0]} ({user[1]})")
        
        # Se não tem usuários, criar
        if len(users) == 0:
            print("\n🔧 Criando usuários...")
            
            admin_hash = hash_password("admin")
            manutencao_hash = hash_password("123456")
            
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("admin", admin_hash, "Administrador", "admin@thors.com", "Admin", 1))
            
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("manutencao", manutencao_hash, "Usuário Manutenção", "manutencao@thors.com", "Manutenção", 1))
            
            conn.commit()
            print("✅ Usuários criados!")
        
        # Testar hash
        cursor.execute("SELECT username, hashed_password FROM usuarios WHERE username = 'admin'")
        admin_data = cursor.fetchone()
        if admin_data:
            stored_hash = admin_data[1]
            test_hash = hash_password("admin")
            print(f"\n🔐 Teste de hash admin:")
            print(f"   Stored: {stored_hash[:20]}...")
            print(f"   Test:   {test_hash[:20]}...")
            print(f"   Match:  {stored_hash == test_hash}")
        
    else:
        print("❌ Tabela usuarios não existe")
        print("🔧 Criando tabela...")
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
        print("✅ Tabela criada! Execute novamente.")

except Exception as e:
    print(f"❌ Erro: {e}")
finally:
    conn.close()
