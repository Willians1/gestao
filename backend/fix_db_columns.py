import sqlite3
from datetime import datetime

conn = sqlite3.connect('gestao_obras.db')
cursor = conn.cursor()

# Verificar colunas existentes
cursor.execute("PRAGMA table_info(usuarios)")
columns = [column[1] for column in cursor.fetchall()]

print("Colunas existentes na tabela usuarios:")
for col in columns:
    print(f"  - {col}")

# Adicionar colunas faltantes
columns_to_add = [
    ('criado_em', 'DATETIME'),
    ('criado_por', 'INTEGER'),
    ('atualizado_em', 'DATETIME'),
    ('atualizado_por', 'INTEGER')
]

for col_name, col_type in columns_to_add:
    if col_name not in columns:
        try:
            cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col_name} {col_type}")
            print(f"✓ Adicionada coluna '{col_name}'")
        except Exception as e:
            print(f"✗ Erro ao adicionar coluna '{col_name}': {e}")
    else:
        print(f"✓ Coluna '{col_name}' já existe")

# Verificar novamente
cursor.execute("PRAGMA table_info(usuarios)")
columns_after = [column[1] for column in cursor.fetchall()]

print("\nColunas após migração:")
for col in columns_after:
    print(f"  - {col}")

conn.commit()
conn.close()

print("\nMigração concluída!")
