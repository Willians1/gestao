"""
Importa clientes e usuários de um banco Postgres de origem para o banco atual da API
(pode ser SQLite ou Postgres, conforme backend/database.py).

Uso (PowerShell):

  # DB de origem (somente leitura), ex.: Render Postgres antigo
  $src = "postgresql+psycopg://user:pass@host:5432/db"
  # Opcional: limpar tabelas de destino antes de inserir
  python backend/import_clients_users_from_postgres.py --pgurl $src --truncate

Notas:
- Preserva IDs ao inserir. Em Postgres destino, ajusta sequence depois.
- Copia apenas tabelas: clientes, usuarios.
"""
from __future__ import annotations
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from models import Base, Cliente, Usuario
from database import SQLALCHEMY_DATABASE_URL as DST_URL


def normalize_pg(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def adjust_sequences(pg: Session):
    # Ajusta sequences para tabelas afetadas
    for table in ("clientes", "usuarios"):
        try:
            pg.execute(text(
                f"SELECT setval(pg_get_serial_sequence(:t, 'id'), COALESCE(MAX(id), 1)) FROM {table}"
            ), {"t": table})
            pg.commit()
        except Exception:
            pg.rollback()


def main():
    ap = argparse.ArgumentParser(description="Importar clientes e usuarios de Postgres fonte para destino atual")
    ap.add_argument("--pgurl", required=True, help="URL do Postgres de origem (postgresql+psycopg://...)")
    ap.add_argument("--truncate", action="store_true", help="Limpa destino antes de inserir")
    args = ap.parse_args()

    src_url = normalize_pg(args.pgurl)
    dst_url = DST_URL
    print(f"Origem: {src_url}")
    print(f"Destino: {dst_url}")

    src_engine = create_engine(src_url, future=True)
    dst_engine = create_engine(dst_url, future=True)

    # Garante schema no destino (apenas por segurança)
    Base.metadata.create_all(bind=dst_engine)

    with Session(src_engine) as src, Session(dst_engine) as dst:
        if args.truncate:
            # Limpa destino nas tabelas de interesse
            for model in (Usuario, Cliente):
                dst.execute(model.__table__.delete())
            dst.commit()

        # Ler fonte
        clientes = src.query(Cliente).all()
        usuarios = src.query(Usuario).all()
        print(f"Fonte: {len(clientes)} clientes, {len(usuarios)} usuarios")

        # Inserir mantendo IDs
        def bulk(model, rows):
            if not rows:
                return 0
            cols = [c.name for c in model.__table__.columns]
            payload = [{c: getattr(r, c) for c in cols} for r in rows]
            dst.execute(model.__table__.insert(), payload)
            return len(payload)

        ins_cli = bulk(Cliente, clientes)
        ins_usu = bulk(Usuario, usuarios)
        dst.commit()
        print(f"Destino: inseridos {ins_cli} clientes, {ins_usu} usuarios")

        # Ajusta sequences se destino for Postgres
        if dst_url.startswith("postgresql+"):
            adjust_sequences(dst)

    print("Concluído.")


if __name__ == "__main__":
    main()
