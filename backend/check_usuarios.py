import sqlite3

def check_usuarios_table():
    conn = sqlite3.connect('gestao_obras.db')
    cursor = conn.cursor()

    try:
        # Verificar schema da tabela
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = cursor.fetchall()
        print("=== SCHEMA DA TABELA USUARIOS ===")
        for col in columns:
            print(f"  {col[1]}: {col[2]}")

        # Verificar dados dos usuários
        cursor.execute("SELECT id, username, hashed_password, nome, email, nivel_acesso, ativo FROM usuarios")
        users = cursor.fetchall()
        print("\n=== USUÁRIOS EXISTENTES ===")
        for user in users:
            print(f"  ID: {user[0]}, Username: {user[1]}, Nome: {user[2]}, Email: {user[3]}, Nivel: {user[4]}, Ativo: {user[5]}")

    except Exception as e:
        print(f"ERRO: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_usuarios_table()
