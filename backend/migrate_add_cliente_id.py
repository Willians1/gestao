#!/usr/bin/env python3
"""
Script de migração para adicionar cliente_id na tabela contratos.
Execute este script antes de usar a nova funcionalidade.
"""

import sqlite3
from pathlib import Path

def migrate_contratos_table():
    """Adiciona a coluna cliente_id na tabela contratos se ela não existir."""
    
    # Conectar ao banco de dados
    db_path = Path(__file__).parent / "gestao_obras.db"
    if not db_path.exists():
        print(f"Banco de dados não encontrado em {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna cliente_id já existe
        cursor.execute("PRAGMA table_info(contratos)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'cliente_id' not in columns:
            print("Adicionando coluna cliente_id à tabela contratos...")
            
            # Adicionar a coluna cliente_id
            cursor.execute("ALTER TABLE contratos ADD COLUMN cliente_id INTEGER")
            
            # Criar uma tabela temporária de mapeamento cliente -> id
            cursor.execute("""
                CREATE TEMPORARY TABLE cliente_mapping AS
                SELECT nome, id FROM clientes
            """)
            
            # Atualizar cliente_id baseado no nome do cliente
            cursor.execute("""
                UPDATE contratos 
                SET cliente_id = (
                    SELECT cm.id 
                    FROM cliente_mapping cm 
                    WHERE cm.nome = contratos.cliente
                )
                WHERE cliente_id IS NULL
            """)
            
            # Para clientes que não foram encontrados, tentar criar um novo cliente
            cursor.execute("""
                SELECT DISTINCT cliente FROM contratos 
                WHERE cliente_id IS NULL AND cliente IS NOT NULL AND cliente != ''
            """)
            clientes_nao_encontrados = cursor.fetchall()
            
            for (nome_cliente,) in clientes_nao_encontrados:
                print(f"Criando cliente não encontrado: {nome_cliente}")
                cursor.execute(
                    "INSERT INTO clientes (nome, cnpj, email, contato, endereco) VALUES (?, '', '', '', '')",
                    (nome_cliente,)
                )
                cliente_id = cursor.lastrowid
                
                # Atualizar contratos com o novo cliente_id
                cursor.execute(
                    "UPDATE contratos SET cliente_id = ? WHERE cliente = ? AND cliente_id IS NULL",
                    (cliente_id, nome_cliente)
                )
            
            print("Migração concluída com sucesso!")
        else:
            print("Coluna cliente_id já existe. Migração não necessária.")
        
        # Verificar quantos contratos foram atualizados
        cursor.execute("SELECT COUNT(*) FROM contratos WHERE cliente_id IS NOT NULL")
        contratos_com_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM contratos")
        total_contratos = cursor.fetchone()[0]
        
        print(f"Contratos com cliente_id: {contratos_com_id}/{total_contratos}")
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_contratos_table()
