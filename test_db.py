#!/usr/bin/env python3
import sqlite3
import hashlib
import sys
import os

# Verificar se estamos no diretório correto
if not os.path.exists('backend/gestao_obras.db'):
    print("❌ Banco não encontrado! Execute este script no diretório raiz do projeto.")
    sys.exit(1)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def test_database():
    print("🔍 TESTE COMPLETO DA BASE DE DADOS")
    print("=================================")
    
    conn = sqlite3.connect('backend/gestao_obras.db')
    cursor = conn.cursor()
    
    try:
        # 1. Verificar se tabela existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'")
        if not cursor.fetchone():
            print("❌ Tabela usuarios não existe!")
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
            print("✅ Tabela criada!")
        else:
            print("✅ Tabela usuarios existe!")
        
        # 2. Verificar estrutura
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = cursor.fetchall()
        print(f"📋 Colunas da tabela: {[col[1] for col in columns]}")
        
        # 3. Verificar se temos usuários
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        count = cursor.fetchone()[0]
        print(f"👤 Total de usuários: {count}")
        
        if count == 0:
            print("🔧 Criando usuários padrão...")
            
            # Criar admin
            admin_hash = hash_password("admin")
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("admin", admin_hash, "Administrador", "admin@thors.com", "Admin", 1))
            
            # Criar manutenção
            manutencao_hash = hash_password("123456")
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("manutencao", manutencao_hash, "Usuário Manutenção", "manutencao@thors.com", "Manutenção", 1))
            
            conn.commit()
            print("✅ Usuários criados!")
        
        # 4. Listar usuários
        cursor.execute("SELECT id, username, nivel_acesso, ativo FROM usuarios")
        users = cursor.fetchall()
        print(f"\n👥 USUÁRIOS CADASTRADOS:")
        for user in users:
            status = "🟢 Ativo" if user[3] else "🔴 Inativo"
            print(f"   ID:{user[0]} | {user[1]} | {user[2]} | {status}")
        
        # 5. Testar autenticação
        print(f"\n🔐 TESTE DE AUTENTICAÇÃO:")
        
        cursor.execute("SELECT username, hashed_password FROM usuarios WHERE username = 'admin'")
        admin_data = cursor.fetchone()
        if admin_data:
            stored_hash = admin_data[1]
            test_hash = hash_password("admin")
            match = stored_hash == test_hash
            print(f"   Admin hash: {'✅ OK' if match else '❌ FALHOU'}")
        
        cursor.execute("SELECT username, hashed_password FROM usuarios WHERE username = 'manutencao'")
        manutencao_data = cursor.fetchone()
        if manutencao_data:
            stored_hash = manutencao_data[1]
            test_hash = hash_password("123456")
            match = stored_hash == test_hash
            print(f"   Manutenção hash: {'✅ OK' if match else '❌ FALHOU'}")
        
        print(f"\n🎯 CREDENCIAIS PARA LOGIN:")
        print(f"   👤 admin / admin")
        print(f"   🔧 manutencao / 123456")
        
        print(f"\n✅ BASE DE DADOS ESTÁ PRONTA!")
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    test_database()
