#!/usr/bin/env python3
"""
Script para criar clientes de exemplo conforme solicitado pelo usuário.
"""

import sqlite3
from pathlib import Path

def create_sample_clients():
    """Cria clientes de exemplo: PEREQUE LOJA 01 (ID 1) e COTIA LOJA 02 (ID 2)."""
    
    # Conectar ao banco de dados
    db_path = Path(__file__).parent / "gestao_obras.db"
    if not db_path.exists():
        print(f"Banco de dados não encontrado em {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se os clientes já existem
        cursor.execute("SELECT id, nome FROM clientes WHERE nome IN ('PEREQUE LOJA 01', 'COTIA LOJA 02')")
        existing_clients = cursor.fetchall()
        
        if existing_clients:
            print("Clientes já existem:")
            for client_id, nome in existing_clients:
                print(f"  ID: {client_id} - {nome}")
        else:
            # Criar os clientes de exemplo
            clients_to_create = [
                ("PEREQUE LOJA 01", "12.345.678/0001-01", "contato@pereque.com.br", "11 99999-1111", "Rua Pereque, 123 - Pereque"),
                ("COTIA LOJA 02", "98.765.432/0001-02", "contato@cotia.com.br", "11 99999-2222", "Av. Cotia, 456 - Cotia")
            ]
            
            for nome, cnpj, email, contato, endereco in clients_to_create:
                cursor.execute("""
                    INSERT INTO clientes (nome, cnpj, email, contato, endereco) 
                    VALUES (?, ?, ?, ?, ?)
                """, (nome, cnpj, email, contato, endereco))
                
                client_id = cursor.lastrowid
                print(f"Cliente criado: ID {client_id} - {nome}")
        
        # Mostrar todos os clientes
        cursor.execute("SELECT id, nome FROM clientes ORDER BY id")
        all_clients = cursor.fetchall()
        
        print("\nTodos os clientes:")
        for client_id, nome in all_clients:
            print(f"  ID: {client_id} - {nome}")
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Erro: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    create_sample_clients()
