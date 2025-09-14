import sqlite3
import hashlib

def fix_admin_user():
    """Corrigir dados do usuário admin"""
    try:
        conn = sqlite3.connect('gestao_obras.db')
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
                ativo = ?,
                is_admin = ?
            WHERE username = ?
        """, (password_hash, "Administrador", "admin@thors.com", "Admin", 1, 1, "admin"))
        
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
