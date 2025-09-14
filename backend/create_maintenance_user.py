import sqlite3
import hashlib

def create_maintenance_user():
    """Criar usuário de manutenção para teste"""
    try:
        conn = sqlite3.connect('gestao_obras.db')
        cursor = conn.cursor()
        
        # Verificar se usuário já existe
        cursor.execute("SELECT id FROM usuarios WHERE username = ?", ("manutencao",))
        existing_user = cursor.fetchone()
        
        password_hash = hashlib.sha256("123456".encode()).hexdigest()
        
        if existing_user:
            print("Usuário manutenção já existe. Atualizando...")
            cursor.execute("""
                UPDATE usuarios 
                SET hashed_password = ?,
                    nome = ?,
                    email = ?,
                    nivel_acesso = ?,
                    ativo = ?,
                    is_admin = ?
                WHERE username = ?
            """, (password_hash, "Técnico Manutenção", "manutencao@thors.com", "Manutenção", 1, 0, "manutencao"))
        else:
            print("Criando usuário manutenção...")
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("manutencao", password_hash, "Técnico Manutenção", "manutencao@thors.com", "Manutenção", 1, 0))
        
        conn.commit()
        
        # Verificar criação
        cursor.execute("SELECT * FROM usuarios WHERE username = ?", ("manutencao",))
        user = cursor.fetchone()
        print("Usuário manutenção:", user)
        
        conn.close()
        print("✅ Usuário manutenção criado/atualizado com sucesso!")
        print("Username: manutencao")
        print("Password: 123456")
        print("Nível: Manutenção")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    create_maintenance_user()
