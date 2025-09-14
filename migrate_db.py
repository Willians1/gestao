#!/usr/bin/env python3
"""
Script simples para migrar o banco de dados SQLite
Adiciona as colunas grupo_id e permissoes na tabela usuarios
"""

import sqlite3
import sys
import os

def migrate_database():
    """Executa a migração do banco de dados"""
    
    try:
        # Mudar para o diretório backend
        if os.path.exists('backend'):
            os.chdir('backend')
        
        # Conectar ao banco
        print("Conectando ao banco de dados...")
        conn = sqlite3.connect('gestao_obras.db')
        cursor = conn.cursor()
        
        # Verificar estrutura atual da tabela usuarios
        print("Verificando estrutura atual da tabela usuarios...")
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = cursor.fetchall()
        
        column_names = [col[1] for col in columns]
        print(f"Colunas atuais: {column_names}")
        
        # Adicionar coluna grupo_id se não existir
        if 'grupo_id' not in column_names:
            print("Adicionando coluna grupo_id...")
            cursor.execute("ALTER TABLE usuarios ADD COLUMN grupo_id INTEGER")
            print("✅ Coluna grupo_id adicionada!")
        else:
            print("✅ Coluna grupo_id já existe!")
        
        # Adicionar coluna permissoes se não existir
        if 'permissoes' not in column_names:
            print("Adicionando coluna permissoes...")
            cursor.execute("ALTER TABLE usuarios ADD COLUMN permissoes TEXT")
            print("✅ Coluna permissoes adicionada!")
        else:
            print("✅ Coluna permissoes já existe!")
        
        # Confirmar mudanças
        conn.commit()
        
        # Verificar estrutura final
        print("\nVerificando estrutura final...")
        cursor.execute("PRAGMA table_info(usuarios)")
        final_columns = cursor.fetchall()
        final_column_names = [col[1] for col in final_columns]
        print(f"Colunas finais: {final_column_names}")
        
        conn.close()
        print("\n✅ Migração concluída com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro durante migração: {e}")
        return False

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
