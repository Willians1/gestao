"""Migração de reparo:
- Adiciona colunas ausentes na tabela clientes (email, contato, endereco)
- Cria lojas padrão se inexistentes
- Cria grupo 'Manutenção' se não existir
- Vincula usuário 'manutencao' ao grupo Manutenção
- (Opcional) vincula todas as lojas ao grupo Manutenção via lojas_grupos com acesso_total

Executar uma vez em ambiente local para corrigir schema quebrado vindo de base antiga.
"""
from __future__ import annotations
import os
import sqlite3
from datetime import datetime

try:
    from database import DB_PATH  # type: ignore
except Exception:
    DB_PATH = None

LOJAS_PADRAO = [
    (1, "Loja 01"),
    (2, "Loja 02"),
    (3, "Loja 03"),
]


def ensure_columns(cur, table: str, columns: dict[str, str]):
    cur.execute(f"PRAGMA table_info({table})")
    existing = {row[1] for row in cur.fetchall()}
    added = []
    for name, ddl in columns.items():
        if name not in existing:
            try:
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")
                added.append(name)
            except Exception as e:
                print(f"✗ Falha ao adicionar coluna {name} em {table}: {e}")
    return added


def up():
    db_path = DB_PATH or os.path.join(os.getcwd(), "gestao_obras.db")
    print(f"Usando banco: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        # 1. Corrigir tabela clientes
        added = ensure_columns(
            cur,
            "clientes",
            {
                "email": "TEXT",
                "contato": "TEXT",
                "endereco": "TEXT",
            },
        )
        if added:
            print("✓ Colunas adicionadas em clientes:", ", ".join(added))
        else:
            print("Nenhuma coluna nova necessária em clientes")

        # 2. Criar lojas padrão
        cur.execute("SELECT id, nome FROM lojas")
        lojas_rows = cur.fetchall()
        existing_ids = {r[0] for r in lojas_rows}
        created_lojas = []
        for loja_id, nome in LOJAS_PADRAO:
            if loja_id not in existing_ids:
                cur.execute(
                    "INSERT INTO lojas (id, nome, codigo, endereco, ativo) VALUES (?, ?, ?, ?, 1)",
                    (loja_id, nome, f"L{loja_id:02d}", None),
                )
                created_lojas.append(nome)
        if created_lojas:
            print("✓ Lojas criadas:", ", ".join(created_lojas))
        else:
            print("Nenhuma loja nova necessária")

        # 3. Garantir grupo 'Manutenção'
        cur.execute("SELECT id FROM grupos_usuarios WHERE lower(nome) = 'manutenção' OR lower(nome) = 'manutencao'")
        row = cur.fetchone()
        grupo_id = None
        if not row:
            cur.execute(
                "INSERT INTO grupos_usuarios (nome, descricao, status) VALUES (?, ?, ?)",
                ("Manutenção", "Grupo de usuários de manutenção", "Aprovado"),
            )
            grupo_id = cur.lastrowid
            print(f"✓ Grupo 'Manutenção' criado (id={grupo_id})")
        else:
            grupo_id = row[0]
            print(f"Grupo 'Manutenção' existente (id={grupo_id})")

        # 4. Vincular usuário manutencao ao grupo se existir
        cur.execute("SELECT id FROM usuarios WHERE lower(username) = 'manutencao'")
        u = cur.fetchone()
        if u and grupo_id:
            cur.execute("UPDATE usuarios SET grupo_id = ? WHERE id = ?", (grupo_id, u[0]))
            print("✓ Usuário manutencao vinculado ao grupo Manutenção")
        else:
            print("Usuário manutencao inexistente – pulei vínculo")

        # 5. Vincular lojas ao grupo (lojas_grupos) se não houver registros
        if grupo_id:
            cur.execute("SELECT COUNT(1) FROM lojas_grupos WHERE grupo_id = ?", (grupo_id,))
            cnt = cur.fetchone()[0]
            if cnt == 0:
                for loja_id, _ in LOJAS_PADRAO:
                    cur.execute(
                        "INSERT INTO lojas_grupos (grupo_id, loja_id, acesso_total) VALUES (?, ?, 1)",
                        (grupo_id, loja_id),
                    )
                print("✓ Lojas vinculadas ao grupo Manutenção (acesso_total=1)")
            else:
                print("Grupo Manutenção já possui lojas vinculadas")

        conn.commit()
        print("\n=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===")
    except Exception as e:
        conn.rollback()
        print("✗ Erro na migração:", e)
    finally:
        conn.close()


if __name__ == "__main__":
    up()
