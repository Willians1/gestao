import os
import sqlite3
from datetime import datetime
import hashlib

try:
    # Usa o mesmo caminho do DB que a API utiliza
    from database import DB_PATH  # type: ignore
except Exception:
    DB_PATH = None


def fix_usuarios_table():
    # Resolve o caminho do banco alvo: prioriza DB_PATH, senão usa arquivo local
    db_path = DB_PATH or os.path.join(os.getcwd(), 'gestao_obras.db')
    os.makedirs(os.path.dirname(db_path) or '.', exist_ok=True)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("=== CORREÇÃO DA TABELA USUARIOS ===")

        # 1. Verificar colunas existentes
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Banco: {db_path}")
        print(f"Colunas existentes: {columns}")

        # 2. Adicionar colunas faltantes
        columns_to_add = [
            ('nome', 'TEXT'),
            ('email', 'TEXT'),
            ('nivel_acesso', 'TEXT DEFAULT "visualizacao"'),
            ('ativo', 'BOOLEAN DEFAULT 1'),
            ('criado_em', 'DATETIME'),
            ('criado_por', 'INTEGER'),
            ('atualizado_em', 'DATETIME'),
            ('atualizado_por', 'INTEGER'),
        ]

        for col_name, col_def in columns_to_add:
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col_name} {col_def}")
                    print(f"✓ Adicionada coluna '{col_name}'")
                except Exception as e:
                    print(f"✗ Erro ao adicionar coluna '{col_name}': {e}")
            else:
                print(f"✓ Coluna '{col_name}' já existe")

        # 3. Atualizar usuários existentes com valores padrão
        print("\n=== ATUALIZANDO USUÁRIOS EXISTENTES ===")

        # Verificar usuários existentes
        cursor.execute("SELECT id, username, hashed_password FROM usuarios")
        users = cursor.fetchall()

        for user_id, username, hashed_password in users:
            # Atualizar nome baseado no username
            nome = username.capitalize() if username != 'admin' else 'Administrador'
            email = f"{username}@empresa.com" if username != 'admin' else 'admin@empresa.com'
            nivel_acesso = 'admin' if username == 'admin' else 'manutencao'
            criado_em = datetime.now().isoformat()

            cursor.execute(
                """
                UPDATE usuarios
                SET nome = ?, email = ?, nivel_acesso = ?, ativo = 1,
                    criado_em = ?, atualizado_em = ?
                WHERE id = ?
                """,
                (nome, email, nivel_acesso, criado_em, criado_em, user_id),
            )

            print(f"✓ Atualizado usuário: {username} (nível: {nivel_acesso})")

        # 4. Verificar se temos usuários admin e manutencao
        cursor.execute("SELECT username, hashed_password, nivel_acesso FROM usuarios WHERE ativo = 1")
        active_users = cursor.fetchall()

        print("\n=== USUÁRIOS ATIVOS ===")
        for username, hashed_password, nivel_acesso in active_users:
            print(f"  {username}: {nivel_acesso}")

        # 5. Garantir que temos os usuários padrão
        if not any(u[0] == 'admin' for u in active_users):
            admin_hash = hashlib.sha256('admin'.encode()).hexdigest()
            cursor.execute(
                """
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
                VALUES (?, ?, 'Administrador', 'admin@empresa.com', 'admin', 1, ?, ?)
                """,
                ('admin', admin_hash, datetime.now().isoformat(), datetime.now().isoformat()),
            )
            print("✓ Criado usuário admin")

        if not any(u[0] == 'manutencao' for u in active_users):
            manutencao_hash = hashlib.sha256('123456'.encode()).hexdigest()
            cursor.execute(
                """
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
                VALUES (?, ?, 'Manutenção', 'manutencao@empresa.com', 'manutencao', 1, ?, ?)
                """,
                ('manutencao', manutencao_hash, datetime.now().isoformat(), datetime.now().isoformat()),
            )
            print("✓ Criado usuário manutencao")

        conn.commit()
        print("\n=== CORREÇÃO CONCLUÍDA COM SUCESSO ===")

        # 6. Verificar resultado final
        cursor.execute("SELECT id, username, nome, nivel_acesso, ativo FROM usuarios")
        final_users = cursor.fetchall()

        print("\n=== USUÁRIOS FINAIS ===")
        for user in final_users:
            print(f"  ID: {user[0]}, Username: {user[1]}, Nome: {user[2]}, Nivel: {user[3]}, Ativo: {user[4]}")

    except Exception as e:
        print(f"ERRO: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    fix_usuarios_table()
