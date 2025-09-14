import sqlite3
import hashlib
from datetime import datetime

def fix_database_schema():
    """Corrige o schema do banco de dados para compatibilidade com o modelo atual"""
    conn = sqlite3.connect('gestao_obras.db')
    cursor = conn.cursor()

    try:
        print("=== CORREÇÃO COMPLETA DO BANCO DE DADOS ===")

        # 1. Verificar colunas existentes na tabela usuarios
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Colunas existentes: {columns}")

        # 2. Remover colunas auditórias se existirem
        audit_columns = ['criado_em', 'criado_por', 'atualizado_em', 'atualizado_por']
        for col in audit_columns:
            if col in columns:
                try:
                    # SQLite não suporta DROP COLUMN diretamente, então recriamos a tabela
                    print(f"Removendo coluna {col}...")
                    # Criar tabela temporária sem as colunas auditórias
                    cursor.execute("""
                        CREATE TABLE usuarios_temp (
                            id INTEGER PRIMARY KEY,
                            username TEXT UNIQUE NOT NULL,
                            hashed_password TEXT NOT NULL,
                            nome TEXT NOT NULL,
                            email TEXT,
                            nivel_acesso TEXT DEFAULT 'visualizacao',
                            ativo INTEGER DEFAULT 1
                        )
                    """)

                    # Copiar dados
                    cursor.execute("""
                        INSERT INTO usuarios_temp (id, username, hashed_password, nome, email, nivel_acesso, ativo)
                        SELECT id, username, hashed_password, nome, email, nivel_acesso, ativo
                        FROM usuarios
                    """)

                    # Substituir tabela
                    cursor.execute("DROP TABLE usuarios")
                    cursor.execute("ALTER TABLE usuarios_temp RENAME TO usuarios")

                    print(f"✓ Coluna {col} removida com sucesso")
                    break  # Só precisamos fazer isso uma vez

                except Exception as e:
                    print(f"✗ Erro ao remover coluna {col}: {e}")

        # 3. Verificar usuários existentes e corrigir senhas se necessário
        cursor.execute("SELECT id, username, hashed_password FROM usuarios")
        users = cursor.fetchall()

        print(f"\n=== VERIFICANDO {len(users)} USUÁRIOS ===")

        for user_id, username, hashed_password in users:
            # Verificar se a senha está em SHA-256 (64 caracteres hex)
            if len(hashed_password) == 64 and all(c in '0123456789abcdefABCDEF' for c in hashed_password):
                print(f"✓ Usuário {username}: senha já está em SHA-256")
            else:
                # Se não estiver em SHA-256, converter
                print(f"⚠ Usuário {username}: senha precisa ser convertida para SHA-256")
                # Assumir que a senha é o próprio username para usuários existentes
                new_hash = hashlib.sha256(username.encode()).hexdigest()
                cursor.execute(
                    "UPDATE usuarios SET hashed_password = ? WHERE id = ?",
                    (new_hash, user_id)
                )
                print(f"✓ Senha do usuário {username} convertida para SHA-256")

        # 4. Garantir que temos usuários padrão
        cursor.execute("SELECT username FROM usuarios WHERE ativo = 1")
        active_users = [row[0] for row in cursor.fetchall()]

        if 'admin' not in active_users:
            admin_hash = hashlib.sha256('admin'.encode()).hexdigest()
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, 'Administrador', 'admin@empresa.com', 'admin', 1)
            """, ('admin', admin_hash))
            print("✓ Usuário admin criado")

        if 'manutencao' not in active_users:
            manutencao_hash = hashlib.sha256('123456'.encode()).hexdigest()
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, 'Manutenção', 'manutencao@empresa.com', 'manutencao', 1)
            """, ('manutencao', manutencao_hash))
            print("✓ Usuário manutencao criado")

        # 5. Verificar resultado final
        cursor.execute("PRAGMA table_info(usuarios)")
        final_columns = [column[1] for column in cursor.fetchall()]
        print(f"\nColunas finais: {final_columns}")

        cursor.execute("SELECT id, username, nome, nivel_acesso, ativo FROM usuarios")
        final_users = cursor.fetchall()

        print("\n=== USUÁRIOS FINAIS ===")
        for user in final_users:
            print(f"  ID: {user[0]}, Username: {user[1]}, Nome: {user[2]}, Nivel: {user[3]}, Ativo: {user[4]}")

        conn.commit()
        print("\n=== CORREÇÃO CONCLUÍDA COM SUCESSO ===")

    except Exception as e:
        print(f"ERRO GERAL: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database_schema()
