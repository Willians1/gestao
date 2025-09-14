import sqlite3
import sys
import os

# Adicionar o diretório raiz do projeto ao path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

def migrate_create_testes_ar_condicionado():
    """Migração para criar a tabela testes_ar_condicionado"""
    
    # Conectar ao banco de dados
    db_path = os.path.join(project_root, "gestao_obras.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar se a tabela já existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='testes_ar_condicionado'
        """)
        
        if cursor.fetchone():
            print("Tabela 'testes_ar_condicionado' já existe. Migração não necessária.")
            return
        
        # Criar a tabela testes_ar_condicionado
        cursor.execute("""
            CREATE TABLE testes_ar_condicionado (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_teste DATE NOT NULL,
                cliente_id INTEGER NOT NULL,
                horario TIME NOT NULL,
                foto TEXT,
                video TEXT,
                status TEXT NOT NULL,
                observacao TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes (id)
            )
        """)
        
        # Confirmar as mudanças
        conn.commit()
        print("Tabela 'testes_ar_condicionado' criada com sucesso!")
        
        # Mostrar estrutura da tabela criada
        cursor.execute("PRAGMA table_info(testes_ar_condicionado)")
        columns = cursor.fetchall()
        print("\nEstrutura da tabela 'testes_ar_condicionado':")
        for col in columns:
            print(f"  {col[1]} {col[2]} {'NOT NULL' if col[3] else 'NULL'}")
        
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_create_testes_ar_condicionado()
