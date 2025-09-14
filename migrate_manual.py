import sqlite3
import os

def migrate_database():
    """Migração manual para adicionar coluna video"""
    try:
        # Conectar ao banco
        db_path = "backend/gestao_obras.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se a coluna existe
        cursor.execute("PRAGMA table_info(testes_loja)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Colunas atuais: {columns}")
        
        if 'video' not in columns:
            print("Adicionando coluna video...")
            cursor.execute("ALTER TABLE testes_loja ADD COLUMN video TEXT")
            conn.commit()
            print("✅ Coluna video adicionada com sucesso!")
        else:
            print("✅ Coluna video já existe!")
        
        # Verificar novamente
        cursor.execute("PRAGMA table_info(testes_loja)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Colunas após migração: {columns}")
        
        conn.close()
        print("✅ Migração concluída!")
        
    except Exception as e:
        print(f"❌ Erro na migração: {e}")

if __name__ == "__main__":
    migrate_database()
