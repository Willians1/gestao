import os
import sqlite3
import hashlib

try:
    # Garante que usamos o mesmo DB da API
    from database import DB_PATH  # type: ignore
except Exception:
    DB_PATH = None

def fix_admin_user():
    """Corrigir dados do usuário admin"""
    try:
        db_path = DB_PATH or os.path.join(os.getcwd(), 'gestao_obras.db')
        os.makedirs(os.path.dirname(db_path) or '.', exist_ok=True)
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar dados atuais
        cursor.execute("SELECT * FROM usuarios WHERE username = ?", ("admin",))
        user = cursor.fetchone()
        print("Dados atuais do admin:", user)
        
        # Atualizar todos os campos do admin
        password_hash = hashlib.sha256("admin".encode()).hexdigest()
        
        cursor.execute("""
            UPDATE usuarios 
            SET hashed_password = ?,
                nome = ?,
                email = ?,
                nivel_acesso = ?,
                ativo = ?
            WHERE username = ?
        """, (password_hash, "Administrador", "admin@thors.com", "Admin", 1, "admin"))
        
        conn.commit()
        
        # Verificar dados após atualização
        cursor.execute("SELECT * FROM usuarios WHERE username = ?", ("admin",))
        user = cursor.fetchone()
        print("Dados após atualização:", user)
        
        conn.close()
        print("✅ Usuário admin corrigido com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    fix_admin_user()
