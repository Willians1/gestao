"""Migrar apenas usuários (tabela usuarios) de um arquivo SQLite local para o Postgres configurado.

Uso:
  # Defina DATABASE_URL apontando para o Postgres de destino
  # (o script tentará detectar gestao_obras.db automaticamente se não passar --sqlite)
  python backend/scripts/migrate_only_users.py [--sqlite caminho_sqlite] [--force-update]

Flags:
  --force-update  Se existir usuário com mesmo username no destino, atualiza nome, email, nivel_acesso e senha.

Regras:
  - Preserva IDs se não conflitar; se houver conflito de ID mas username diferente, ignora o registro.
  - Se username já existe e --force-update não for usado, pula.
"""
from __future__ import annotations
import argparse
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Reutiliza modelos
from models import Base, Usuario  # type: ignore

# Detecta Postgres via DATABASE_URL
from database import SQLALCHEMY_DATABASE_URL  # type: ignore

def _normalize_pg_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url

def infer_sqlite() -> str:
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "gestao_obras.db"),
        os.path.join(os.path.dirname(__file__), "..", "..", "gestao_obras.db"),
        os.path.join(os.path.dirname(__file__), "..", "backend", "gestao_obras.db"),
    ]
    for c in candidates:
        c_abs = os.path.abspath(c)
        if os.path.exists(c_abs):
            return c_abs
    raise SystemExit("Arquivo gestao_obras.db não encontrado. Informe --sqlite.")

def migrate_users(sqlite_path: str, force_update: bool):
    pg_url = _normalize_pg_url(SQLALCHEMY_DATABASE_URL)
    if not pg_url.startswith("postgresql+"):
        raise SystemExit("DATABASE_URL não aponta para Postgres.")

    sqlite_url = f"sqlite:///{os.path.abspath(sqlite_path)}"
    print(f"SQLite origem: {sqlite_url}")
    print(f"Postgres destino: {pg_url}")

    src_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False}, future=True)
    dst_engine = create_engine(pg_url, future=True)

    # Garante schema (caso tabela ainda não exista)
    Base.metadata.create_all(bind=dst_engine, tables=[Usuario.__table__])

    inserted = 0
    updated = 0
    skipped = 0

    with Session(src_engine) as src, Session(dst_engine) as dst:
        users = src.query(Usuario).all()
        print(f"Origem possui {len(users)} usuários.")
        for u in users:
            exists = dst.query(Usuario).filter(Usuario.username == u.username).first()
            if exists:
                if force_update:
                    changed = False
                    for attr in ["nome", "email", "nivel_acesso", "hashed_password", "ativo", "grupo_id"]:
                        src_val = getattr(u, attr)
                        if getattr(exists, attr) != src_val:
                            setattr(exists, attr, src_val)
                            changed = True
                    if changed:
                        dst.add(exists)
                        updated += 1
                else:
                    skipped += 1
                continue
            # Se ID conflitar com outro usuário diferente, deixar None para autoincrement
            id_conflict = dst.query(Usuario).filter(Usuario.id == u.id).first()
            insert_data = {
                "username": u.username,
                "hashed_password": u.hashed_password,
                "nome": u.nome,
                "email": u.email,
                "nivel_acesso": u.nivel_acesso,
                "ativo": u.ativo,
                "grupo_id": u.grupo_id,
            }
            if not id_conflict:
                insert_data["id"] = u.id
            dst.execute(Usuario.__table__.insert(), [insert_data])
            inserted += 1
        dst.commit()

    print(f"Concluído. Inseridos: {inserted} | Atualizados: {updated} | Pulados: {skipped}")


def main():
    parser = argparse.ArgumentParser(description="Migrar somente usuários do SQLite para Postgres")
    parser.add_argument("--sqlite", dest="sqlite", default=None, help="Caminho do SQLite (opcional)")
    parser.add_argument("--force-update", dest="force", action="store_true", help="Atualiza registros existentes pelo username")
    args = parser.parse_args()
    path = args.sqlite or infer_sqlite()
    migrate_users(path, args.force)

if __name__ == "__main__":
    main()
