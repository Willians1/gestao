#!/usr/bin/env python3
"""
Script para adicionar coluna cliente_id à tabela valor_materiais.

Esta coluna permite associar materiais a clientes específicos.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import engine
from sqlalchemy import text

def migrate():
    """Adiciona coluna cliente_id à tabela valor_materiais se não existir."""
    print("Verificando schema da tabela valor_materiais...")
    
    with engine.connect() as conn:
        # Verifica se coluna já existe
        result = conn.execute(text("PRAGMA table_info(valor_materiais)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'cliente_id' in columns:
            print("✓ Coluna cliente_id já existe")
            return
        
        print("Adicionando coluna cliente_id...")
        conn.execute(text("""
            ALTER TABLE valor_materiais 
            ADD COLUMN cliente_id INTEGER NULL
        """))
        conn.commit()
        
        print("✓ Coluna cliente_id adicionada com sucesso")
        print("  (valores NULL indicam material compartilhado entre todos os clientes)")

if __name__ == "__main__":
    migrate()
