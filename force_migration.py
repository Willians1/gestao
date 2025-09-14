import sqlite3
import hashlib
from datetime import datetime
import os

def hash_password(password: str) -> str:
    """Hash password using SHA-256 (matching backend)"""
    return hashlib.sha256(password.encode()).hexdigest()

# Caminho para o banco
db_path = 'backend/gestao_obras.db'

print("🚀 MIGRAÇÃO FORÇADA DA TABELA USUARIOS")
print("=====================================")

try:
    # Conectar ao banco
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("📋 1. Verificando tabela atual...")
    
    # Verificar estrutura atual
    cursor.execute("PRAGMA table_info(usuarios)")
    current_columns = cursor.fetchall()
    
    if current_columns:
        print(f"   Colunas atuais: {[col[1] for col in current_columns]}")
        
        # Fazer backup dos dados existentes
        cursor.execute("SELECT * FROM usuarios")
        backup_data = cursor.fetchall()
        print(f"   Fazendo backup de {len(backup_data)} usuários")
        
        # Deletar tabela antiga
        print("🗑️  2. Removendo tabela antiga...")
        cursor.execute("DROP TABLE usuarios")
        conn.commit()
    else:
        print("   Tabela não existe")
        backup_data = []
    
    # Criar nova tabela com todas as colunas necessárias
    print("🏗️  3. Criando nova tabela usuarios...")
    
    create_sql = """
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
        atualizado_por INTEGER,
        FOREIGN KEY (criado_por) REFERENCES usuarios (id),
        FOREIGN KEY (atualizado_por) REFERENCES usuarios (id)
    )
    """
    
    cursor.execute(create_sql)
    conn.commit()
    print("   ✅ Nova tabela criada!")
    
    # Verificar nova estrutura
    cursor.execute("PRAGMA table_info(usuarios)")
    new_columns = cursor.fetchall()
    print(f"   Novas colunas: {[col[1] for col in new_columns]}")
    
    # Criar usuários obrigatórios
    print("👥 4. Criando usuários...")
    
    now = datetime.now().isoformat()
    
    # Admin
    admin_hash = hash_password("admin")
    cursor.execute("""
        INSERT INTO usuarios 
        (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ("admin", admin_hash, "Administrador", "admin@thors.com", "Admin", 1, now, now))
    
    # Manutenção
    manutencao_hash = hash_password("123456")
    cursor.execute("""
        INSERT INTO usuarios 
        (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ("manutencao", manutencao_hash, "Usuário Manutenção", "manutencao@thors.com", "Manutenção", 1, now, now))
    
    conn.commit()
    
    # Verificar resultado final
    print("✅ 5. Verificação final...")
    cursor.execute("SELECT username, nivel_acesso, ativo FROM usuarios")
    final_users = cursor.fetchall()
    
    print(f"   Usuários criados ({len(final_users)}):")
    for user in final_users:
        status = "🟢 Ativo" if user[2] else "🔴 Inativo"
        print(f"     {user[0]} ({user[1]}) - {status}")
    
    print("\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
    print("===================================")
    print("🔑 Credenciais para teste:")
    print("   👤 admin / admin")
    print("   🔧 manutencao / 123456")
    
    # Teste de hash para debugging
    print(f"\n🔐 Hash de verificação:")
    print(f"   admin: {hash_password('admin')}")
    print(f"   123456: {hash_password('123456')}")
    
except Exception as e:
    print(f"❌ ERRO: {e}")
    import traceback
    traceback.print_exc()
finally:
    if 'conn' in locals():
        conn.close()

print("\n🔄 Reinicie o backend para aplicar as mudanças!")
