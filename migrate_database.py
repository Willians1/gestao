#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import SessionLocal, engine
from backend.models import Base
import sqlite3

def migrate_database():
    print("🔄 Iniciando migração do banco de dados...")
    
    # Conectar ao SQLite diretamente para alterações de schema
    db_path = "backend/gestao_obras.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna grupo_id já existe
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'grupo_id' not in columns:
            print("➕ Adicionando coluna grupo_id à tabela usuarios...")
            cursor.execute("ALTER TABLE usuarios ADD COLUMN grupo_id INTEGER")
            print("✅ Coluna grupo_id adicionada com sucesso!")
        else:
            print("ℹ️  Coluna grupo_id já existe na tabela usuarios")
        
        # Criar as novas tabelas se não existirem
        print("🔨 Criando novas tabelas...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas/verificadas com sucesso!")
        
        conn.commit()
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()
    
    print("🎉 Migração concluída!")

if __name__ == '__main__':
    migrate_database()
