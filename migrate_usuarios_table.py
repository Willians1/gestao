import sqlite3
import hashlib
from datetime import datetime

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

# Conectar ao banco
conn = sqlite3.connect('backend/gestao_obras.db')
cursor = conn.cursor()

try:
    # Verificar se a tabela usuarios existe e sua estrutura
    cursor.execute("PRAGMA table_info(usuarios);")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    
    print(f"Colunas existentes: {column_names}")
    
    # Verificar se as colunas necessárias existem
    required_columns = ['criado_em', 'criado_por', 'atualizado_em', 'atualizado_por']
    missing_columns = [col for col in required_columns if col not in column_names]
    
    if missing_columns:
        print(f"Colunas em falta: {missing_columns}")
        
        # Backup dos dados existentes
        cursor.execute("SELECT * FROM usuarios;")
        existing_users = cursor.fetchall()
        
        print(f"Fazendo backup de {len(existing_users)} usuários")
        
        # Deletar a tabela antiga
        cursor.execute("DROP TABLE IF EXISTS usuarios;")
        
        # Criar a nova tabela com todas as colunas
        create_table_sql = """
        CREATE TABLE usuarios (
            id INTEGER PRIMARY KEY,
            username VARCHAR UNIQUE NOT NULL,
            hashed_password VARCHAR NOT NULL,
            nome VARCHAR NOT NULL,
            email VARCHAR,
            nivel_acesso VARCHAR NOT NULL DEFAULT 'visualizacao',
            ativo BOOLEAN DEFAULT 1,
            criado_em DATETIME,
            criado_por INTEGER,
            atualizado_em DATETIME,
            atualizado_por INTEGER,
            FOREIGN KEY (criado_por) REFERENCES usuarios (id),
            FOREIGN KEY (atualizado_por) REFERENCES usuarios (id)
        );
        """
        
        cursor.execute(create_table_sql)
        print("Nova tabela usuarios criada!")
        
        # Restaurar dados existentes (se houver)
        if existing_users:
            now = datetime.now().isoformat()
            for user in existing_users:
                # Assumindo estrutura antiga: id, username, hashed_password, nome, email, nivel_acesso, ativo
                cursor.execute("""
                    INSERT INTO usuarios 
                    (id, username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (user[0], user[1], user[2], user[3], user[4], user[5], user[6], now, now))
            print(f"Restaurados {len(existing_users)} usuários")
    
    # Agora criar os usuários necessários
    now = datetime.now().isoformat()
    
    # Criar usuário admin
    admin_password = hash_password("admin")
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO usuarios 
            (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, ("admin", admin_password, "Administrador", "admin@thors.com", "Admin", True, now, now))
        print("Usuário admin criado/atualizado")
    except Exception as e:
        print(f"Erro ao criar admin: {e}")
    
    # Criar usuário manutencao
    manutencao_password = hash_password("123456")
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO usuarios 
            (username, hashed_password, nome, email, nivel_acesso, ativo, criado_em, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, ("manutencao", manutencao_password, "Usuário Manutenção", "manutencao@thors.com", "Manutenção", True, now, now))
        print("Usuário manutencao criado/atualizado")
    except Exception as e:
        print(f"Erro ao criar manutencao: {e}")
    
    # Commit e verificar
    conn.commit()
    
    # Verificar usuários criados
    cursor.execute("SELECT username, nivel_acesso, ativo FROM usuarios;")
    users = cursor.fetchall()
    print(f"\nUsuários na tabela:")
    for user in users:
        print(f"  {user[0]} - {user[1]} - {'Ativo' if user[2] else 'Inativo'}")
    
    print("\nMigração concluída com sucesso!")
    
except Exception as e:
    print(f"Erro durante migração: {e}")
finally:
    conn.close()
