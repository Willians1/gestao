"""
Script de migração para atualizar a tabela despesas com novos campos
"""
import sqlite3
import os

def migrate_despesas_table():
    # Caminho para o banco de dados
    db_path = "gestao_obras.db"
    
    if not os.path.exists(db_path):
        print(f"Banco de dados {db_path} não encontrado.")
        return
    
    # Conectar ao banco
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se as colunas já existem
        cursor.execute("PRAGMA table_info(despesas)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Colunas atuais na tabela despesas: {columns}")
        
        # Adicionar novas colunas se não existirem
        new_columns = [
            ("id_cliente", "INTEGER"),
            ("servico", "TEXT"),
            ("categoria", "TEXT"),
            ("status", "TEXT DEFAULT 'Pendente'"),
            ("observacoes", "TEXT")
        ]
        
        for column_name, column_type in new_columns:
            if column_name not in columns:
                sql = f"ALTER TABLE despesas ADD COLUMN {column_name} {column_type}"
                print(f"Executando: {sql}")
                cursor.execute(sql)
                print(f"Coluna {column_name} adicionada com sucesso.")
            else:
                print(f"Coluna {column_name} já existe.")
        
        # Commit das mudanças
        conn.commit()
        print("Migração concluída com sucesso!")
        
        # Verificar novamente as colunas
        cursor.execute("PRAGMA table_info(despesas)")
        columns_after = [column[1] for column in cursor.fetchall()]
        print(f"Colunas após migração: {columns_after}")
        
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_despesas_table()
