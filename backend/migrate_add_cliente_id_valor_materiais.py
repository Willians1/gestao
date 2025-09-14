#!/usr/bin/env python3
"""
Script para adicionar coluna cliente_id à tabela valor_materiais
"""

import sqlite3
from pathlib import Path

def migrate_valor_materiais():
    """Adiciona coluna cliente_id à tabela valor_materiais."""
    
    # Conectar ao banco de dados
    db_path = Path(__file__).parent / "gestao_obras.db"
    if not db_path.exists():
        print(f"Banco de dados não encontrado em {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(valor_materiais)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'cliente_id' in columns:
            print("Coluna cliente_id já existe na tabela valor_materiais")
        else:
            print("Adicionando coluna cliente_id à tabela valor_materiais...")
            cursor.execute("ALTER TABLE valor_materiais ADD COLUMN cliente_id INTEGER REFERENCES clientes(id)")
            print("Coluna cliente_id adicionada com sucesso!")
        
        # Mostrar estrutura atualizada da tabela
        cursor.execute("PRAGMA table_info(valor_materiais)")
        columns_info = cursor.fetchall()
        print("\nEstrutura da tabela valor_materiais:")
        for col in columns_info:
            print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULL'}")
        
        # Verificar quantos registros têm cliente_id
        cursor.execute("SELECT COUNT(*) FROM valor_materiais WHERE cliente_id IS NOT NULL")
        count_with_client = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM valor_materiais")
        total_count = cursor.fetchone()[0]
        
        print(f"\nMateriais com cliente_id: {count_with_client}/{total_count}")
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Erro: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_valor_materiais()
