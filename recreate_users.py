import sqlite3
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Conectar ao banco
conn = sqlite3.connect('backend/gestao_obras.db')
cursor = conn.cursor()

print("🔧 RECRIANDO TABELA E USUÁRIOS")
print("=============================")

try:
    # Apagar tabela usuarios se existir
    cursor.execute("DROP TABLE IF EXISTS usuarios")
    print("🗑️ Tabela usuarios removida")
    
    # Criar nova tabela simples
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
    print("✅ Nova tabela usuarios criada")
    
    # Criar usuários
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
    
    # Verificar usuários criados
    cursor.execute("SELECT id, username, nivel_acesso, ativo FROM usuarios")
    users = cursor.fetchall()
    
    print(f"\n✅ Usuários criados ({len(users)}):")
    for user in users:
        status = "🟢 Ativo" if user[3] else "🔴 Inativo"
        print(f"   ID:{user[0]} - {user[1]} ({user[2]}) - {status}")
    
    # Testar hash
    cursor.execute("SELECT hashed_password FROM usuarios WHERE username = 'admin'")
    admin_hash_stored = cursor.fetchone()[0]
    test_hash = hash_password("admin")
    print(f"\n🔐 Teste de hash:")
    print(f"   Hash match: {'✅ SIM' if admin_hash_stored == test_hash else '❌ NÃO'}")
    
    print(f"\n🎉 SUCESSO! Credenciais:")
    print(f"   👤 admin / admin")
    print(f"   🔧 manutencao / 123456")

except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
finally:
    conn.close()

print("\n🔄 Backend será reiniciado automaticamente!")
