import sqlite3
import hashlib
from datetime import datetime

def hash_password(password):
    """Criar hash da senha usando SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_admin_user():
    """Criar usuário admin com senha admin"""
    try:
        # Conectar ao banco de dados
        conn = sqlite3.connect('gestao_obras.db')
        cursor = conn.cursor()
        
        # Verificar se a tabela usuarios existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='usuarios'
        """)
        
        if not cursor.fetchone():
            print("Tabela usuarios não encontrada. Criando tabela...")
            # Criar tabela usuarios se não existir
            cursor.execute("""
                CREATE TABLE usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    nome VARCHAR(100) NOT NULL,
                    email VARCHAR(100),
                    nivel_acesso VARCHAR(20) DEFAULT 'Manutenção',
                    ativo BOOLEAN DEFAULT 1,
                    is_admin BOOLEAN DEFAULT 0
                )
            """)
            print("Tabela usuarios criada.")
        
        # Verificar se usuário admin já existe
        cursor.execute("SELECT id FROM usuarios WHERE username = ?", ("admin",))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("Usuário admin já existe. Atualizando senha...")
            # Atualizar senha do admin existente
            password_hash = hash_password("admin")
            cursor.execute("""
                UPDATE usuarios 
                SET hashed_password = ? 
                WHERE username = ?
            """, (password_hash, "admin"))
        else:
            print("Criando usuário admin...")
            # Criar novo usuário admin
            password_hash = hash_password("admin")
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("admin", password_hash, "Administrador", "admin@thors.com", "Admin", True, True))
        
        # Commit das alterações
        conn.commit()
        
        # Verificar se foi criado/atualizado com sucesso
        cursor.execute("SELECT * FROM usuarios WHERE username = ?", ("admin",))
        user = cursor.fetchone()
        
        if user:
            print("✅ Usuário admin criado/atualizado com sucesso!")
            print(f"ID: {user[0]}")
            print(f"Username: {user[1]}")
            print(f"Nome: {user[3]}")
            print(f"Email: {user[4]}")
            print(f"Nível de Acesso: {user[5]}")
            print(f"Ativo: {user[6]}")
            print(f"Criado em: {user[7]}")
        else:
            print("❌ Erro ao criar usuário admin")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    create_admin_user()
