#!/usr/bin/env python3

import sys
import os

# Adicionar o backend ao caminho do Python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import hashlib
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Função para hash SHA-256 (mesma do backend)
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Conectar ao banco
DATABASE_URL = "sqlite:///backend/gestao_obras.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("🔄 Iniciando correção da tabela usuarios...")

try:
    with engine.connect() as conn:
        # Verificar se a tabela existe
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'"))
        table_exists = result.fetchone() is not None
        
        if table_exists:
            print("📋 Tabela usuarios existe. Verificando estrutura...")
            # Verificar estrutura
            result = conn.execute(text("PRAGMA table_info(usuarios)"))
            columns = [row[1] for row in result.fetchall()]
            print(f"   Colunas atuais: {columns}")
            
            # Verificar se tem as colunas necessárias
            required_cols = ['criado_em', 'criado_por', 'atualizado_em', 'atualizado_por']
            missing_cols = [col for col in required_cols if col not in columns]
            
            if missing_cols:
                print(f"❌ Colunas em falta: {missing_cols}")
                print("🗑️  Removendo tabela antiga...")
                conn.execute(text("DROP TABLE usuarios"))
                conn.commit()
                table_exists = False
            else:
                print("✅ Estrutura da tabela está correta!")
        
        if not table_exists:
            print("🏗️  Criando nova tabela usuarios...")
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
            conn.execute(text(create_sql))
            conn.commit()
            print("✅ Tabela usuarios criada!")
        
        # Verificar se os usuários existem
        result = conn.execute(text("SELECT username FROM usuarios WHERE username IN ('admin', 'manutencao')"))
        existing_users = [row[0] for row in result.fetchall()]
        
        now = datetime.now().isoformat()
        
        # Criar usuário admin se não existir
        if 'admin' not in existing_users:
            admin_hash = hash_password("admin")
            conn.execute(text("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
                VALUES (:username, :password, :nome, :email, :nivel, :ativo, :criado, :atualizado)
            """), {
                'username': 'admin',
                'password': admin_hash,
                'nome': 'Administrador',
                'email': 'admin@thors.com',
                'nivel': 'Admin',
                'ativo': True,
                'criado': now,
                'atualizado': now
            })
            print("✅ Usuário admin criado!")
        else:
            print("ℹ️  Usuário admin já existe")
        
        # Criar usuário manutenção se não existir
        if 'manutencao' not in existing_users:
            manutencao_hash = hash_password("123456")
            conn.execute(text("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
                VALUES (:username, :password, :nome, :email, :nivel, :ativo, :criado, :atualizado)
            """), {
                'username': 'manutencao',
                'password': manutencao_hash,
                'nome': 'Usuário Manutenção',
                'email': 'manutencao@thors.com',
                'nivel': 'Manutenção',
                'ativo': True,
                'criado': now,
                'atualizado': now
            })
            print("✅ Usuário manutencao criado!")
        else:
            print("ℹ️  Usuário manutencao já existe")
        
        conn.commit()
        
        # Verificar resultado final
        result = conn.execute(text("SELECT username, nivel_acesso, ativo FROM usuarios"))
        users = result.fetchall()
        
        print(f"\n📊 Usuários na tabela ({len(users)}):")
        for user in users:
            status = "🟢 Ativo" if user[2] else "🔴 Inativo"
            print(f"   {user[0]} ({user[1]}) - {status}")
        
        print("\n🎉 Correção da tabela concluída com sucesso!")
        print("\n🔑 Credenciais de login:")
        print("   👤 admin / admin (Acesso completo)")
        print("   🔧 manutencao / 123456 (Apenas testes)")

except Exception as e:
    print(f"❌ Erro durante a correção: {e}")
    import traceback
    traceback.print_exc()
