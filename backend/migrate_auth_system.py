#!/usr/bin/env python3
"""
Script para migrar e atualizar o banco de dados com os novos campos de auditoria
e controle de acesso.
"""

import sqlite3
from datetime import datetime
import os

def migrate_database():
    # Caminho para o banco de dados
    db_path = "gestao_obras.db"
    
    if not os.path.exists(db_path):
        print("Banco de dados não encontrado!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Iniciando migração do banco de dados...")
        
        # 1. Atualizar tabela usuarios
        print("1. Atualizando tabela usuarios...")
        
        # Verificar se as colunas já existem
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'nome' not in columns:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN nome TEXT")
            print("   - Adicionada coluna 'nome'")
        
        if 'email' not in columns:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN email TEXT")
            print("   - Adicionada coluna 'email'")
            
        if 'nivel_acesso' not in columns:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN nivel_acesso TEXT DEFAULT 'visualizacao'")
            print("   - Adicionada coluna 'nivel_acesso'")
            
        if 'ativo' not in columns:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN DEFAULT 1")
            print("   - Adicionada coluna 'ativo'")
            
        if 'criado_em' not in columns:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN criado_em DATETIME")
            print("   - Adicionada coluna 'criado_em'")
            
        if 'criado_por' not in columns:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN criado_por INTEGER")
            print("   - Adicionada coluna 'criado_por'")
            
        if 'atualizado_em' not in columns:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN atualizado_em DATETIME")
            print("   - Adicionada coluna 'atualizado_em'")
            
        if 'atualizado_por' not in columns:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN atualizado_por INTEGER")
            print("   - Adicionada coluna 'atualizado_por'")
        
        # 2. Atualizar tabela testes_loja
        print("2. Atualizando tabela testes_loja...")
        
        cursor.execute("PRAGMA table_info(testes_loja)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'criado_por' not in columns:
            cursor.execute("ALTER TABLE testes_loja ADD COLUMN criado_por INTEGER")
            print("   - Adicionada coluna 'criado_por'")
            
        if 'atualizado_em' not in columns:
            cursor.execute("ALTER TABLE testes_loja ADD COLUMN atualizado_em DATETIME")
            print("   - Adicionada coluna 'atualizado_em'")
            
        if 'atualizado_por' not in columns:
            cursor.execute("ALTER TABLE testes_loja ADD COLUMN atualizado_por INTEGER")
            print("   - Adicionada coluna 'atualizado_por'")
        
        # 3. Atualizar tabela testes_ar_condicionado
        print("3. Atualizando tabela testes_ar_condicionado...")
        
        # Verificar se a tabela existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='testes_ar_condicionado'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(testes_ar_condicionado)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'criado_por' not in columns:
                cursor.execute("ALTER TABLE testes_ar_condicionado ADD COLUMN criado_por INTEGER")
                print("   - Adicionada coluna 'criado_por'")
                
            if 'atualizado_em' not in columns:
                cursor.execute("ALTER TABLE testes_ar_condicionado ADD COLUMN atualizado_em DATETIME")
                print("   - Adicionada coluna 'atualizado_em'")
                
            if 'atualizado_por' not in columns:
                cursor.execute("ALTER TABLE testes_ar_condicionado ADD COLUMN atualizado_por INTEGER")
                print("   - Adicionada coluna 'atualizado_por'")
        
        # 4. Criar tabela de auditoria
        print("4. Criando tabela de auditoria...")
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auditoria_ocorrencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tabela TEXT NOT NULL,
                registro_id INTEGER NOT NULL,
                acao TEXT NOT NULL,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
                usuario_nome TEXT NOT NULL,
                data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
                valores_anteriores TEXT,
                valores_novos TEXT,
                observacao TEXT
            )
        """)
        print("   - Tabela auditoria_ocorrencias criada")
        
        # 5. Atualizar usuários existentes
        print("5. Atualizando usuários existentes...")
        
        # Verificar se existe algum usuário
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        user_count = cursor.fetchone()[0]
        
        if user_count == 0:
            # Criar usuário admin padrão
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdgrsJF.1Le3W', 
                  'Administrador Sistema', 'admin@thors.com', 'admin', 1))
            print("   - Usuário admin criado")
        else:
            # Atualizar usuários existentes que não tem nome
            cursor.execute("UPDATE usuarios SET nome = 'Usuário Sistema' WHERE nome IS NULL OR nome = ''")
            cursor.execute("UPDATE usuarios SET nivel_acesso = 'admin' WHERE nivel_acesso IS NULL OR nivel_acesso = ''")
            print("   - Usuários existentes atualizados")
        
        conn.commit()
        print("\n✅ Migração concluída com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
