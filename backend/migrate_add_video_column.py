import sqlite3
import os

def migrate_add_video_column():
    """Adiciona a coluna 'video' na tabela testes_loja"""
    
    # Conectar ao banco de dados
    db_path = "gestao_obras.db"
    if not os.path.exists(db_path):
        print(f"Banco de dados não encontrado: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna 'video' já existe
        cursor.execute("PRAGMA table_info(testes_loja)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'video' not in columns:
            print("Adicionando coluna 'video' na tabela testes_loja...")
            cursor.execute("ALTER TABLE testes_loja ADD COLUMN video TEXT")
            conn.commit()
            print("Coluna 'video' adicionada com sucesso!")
        else:
            print("Coluna 'video' já existe na tabela testes_loja.")
        
        # Verificar a estrutura atual da tabela
        cursor.execute("PRAGMA table_info(testes_loja)")
        columns_info = cursor.fetchall()
        print("\nEstrutura atual da tabela testes_loja:")
        for column in columns_info:
            print(f"  - {column[1]} ({column[2]})")
            
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_add_video_column()
