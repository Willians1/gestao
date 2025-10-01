"""
Migração de dados do PostgreSQL (DATABASE_URL) para SQLite (arquivo).

- Preserva IDs
- Ordem de tabelas respeitando relações principais
- Opção de truncate no destino

Uso (PowerShell):

  # Fonte: Postgres; Destino: arquivo SQLite em /var/data/gestao_obras.db
  python backend/migrate_postgres_to_sqlite.py --pgurl "postgresql+psycopg://user:pass@host:5432/db" --sqlite "/var/data/gestao_obras.db" --truncate

Se --sqlite não for informado, será usado um caminho padrão gravável (DATA_DIR/gestao_obras.db, etc.).
Se --pgurl não for informado, usa DATABASE_URL/DB_URL do ambiente.
"""
from __future__ import annotations
import argparse
import os
import sys
from typing import List, Type

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from models import (
    Base,
    Usuario,
    GrupoUsuario,
    Cliente,
    ClienteGrupo,
    Loja,
    LojaGrupo,
    Fornecedor,
    OrcamentoObra,
    Despesa,
    Contrato,
    ArquivoImportado,
    TabelaImportada,
    ResumoMensal,
    ValorMaterial,
    TesteLoja,
    TesteArCondicionado,
    PermissaoSistema,
    PermissaoGrupo,
    AuditoriaOcorrencia,
)


def _normalize_pg_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def infer_pg_url(cli_value: str | None) -> str:
    url = cli_value or os.getenv("DATABASE_URL") or os.getenv("DB_URL")
    if not url:
        raise SystemExit("DATABASE_URL/DB_URL não definida e --pgurl não informado.")
    return _normalize_pg_url(url)


def _pick_writable_dir() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.getenv("DB_DIR"),
        os.getenv("DATA_DIR"),
        "/var/data",
        "/data",
        os.path.join(base_dir, "data"),
        "/tmp",
    ]
    for d in candidates:
        if not d:
            continue
        try:
            os.makedirs(d, exist_ok=True)
            test_file = os.path.join(d, ".writable_test")
            with open(test_file, "w", encoding="utf-8") as f:
                f.write("ok")
            os.remove(test_file)
            return d
        except Exception:
            continue
    return base_dir


def infer_sqlite_path(cli_value: str | None) -> str:
    if cli_value:
        # Garante diretório
        d = os.path.dirname(os.path.abspath(cli_value)) or "."
        os.makedirs(d, exist_ok=True)
        return os.path.abspath(cli_value)
    # Padrão: DATA_DIR/gestao_obras.db (ou similar)
    d = _pick_writable_dir()
    return os.path.join(d, "gestao_obras.db")


LOAD_ORDER: List[Type] = [
    # Entidades base
    Cliente,
    GrupoUsuario,
    PermissaoSistema,
    # Tabelas de ligação
    ClienteGrupo,
    PermissaoGrupo,
    Loja,
    LojaGrupo,
    # Usuários (referenciam grupo)
    Usuario,
    # Domínio de negócio
    Fornecedor,
    OrcamentoObra,
    Despesa,
    Contrato,
    ValorMaterial,
    ResumoMensal,
    ArquivoImportado,
    TabelaImportada,
    TesteLoja,
    TesteArCondicionado,
    # Auditoria por último
    AuditoriaOcorrencia,
]


def truncate_all(sqlite: Session):
    # Em SQLite, apenas apaga em ordem reversa
    for model in reversed(LOAD_ORDER):
        table = model.__table__
        sqlite.execute(table.delete())
    sqlite.commit()


def migrate(pg_url: str, sqlite_path: str, do_truncate: bool):
    sqlite_url = f"sqlite:///{os.path.abspath(sqlite_path)}"
    print(f"Postgres origem: {pg_url}")
    print(f"SQLite destino: {sqlite_url}")

    src_engine = create_engine(pg_url, future=True)
    dst_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False}, future=True)

    # Cria schema no destino
    Base.metadata.create_all(bind=dst_engine)

    with Session(src_engine) as src, Session(dst_engine) as dst:
        # Se solicitado, limpa destino
        if do_truncate:
            truncate_all(dst)

        any_existing = False
        try:
            for probe in [Usuario, Cliente]:
                count = dst.query(probe).count()
                if count > 0:
                    any_existing = True
                    print(f"[INFO] Destino já possui {count} registros em {probe.__tablename__}.")
            if any_existing and not do_truncate:
                print("[ABORT] Destino não está vazio. Use --truncate para limpar antes, ou ajuste o script para append.")
                return
        except Exception:
            pass

        # Copia dados na ordem definida, preservando IDs
        for model in LOAD_ORDER:
            name = model.__tablename__
            rows = src.query(model).all()
            if not rows:
                print(f"{name}: 0 registros (nada a fazer)")
                continue

            to_insert = []
            cols = [c.name for c in model.__table__.columns]
            for obj in rows:
                data = {c: getattr(obj, c) for c in cols}
                to_insert.append(data)

            dst.execute(model.__table__.insert(), to_insert)
            dst.commit()
            print(f"{name}: migrados {len(to_insert)} registros")

    print("Concluído com sucesso.")


def main():
    parser = argparse.ArgumentParser(description="Migrar dados do Postgres para SQLite")
    parser.add_argument("--pgurl", dest="pg_url", help="URL do Postgres de origem", default=None)
    parser.add_argument("--sqlite", dest="sqlite_path", help="Caminho do arquivo SQLite de destino", default=None)
    parser.add_argument("--truncate", dest="truncate", help="Limpar destino antes de inserir", action="store_true")
    args = parser.parse_args()

    pg_url = infer_pg_url(args.pg_url)
    sqlite_path = infer_sqlite_path(args.sqlite_path)

    try:
        migrate(pg_url, sqlite_path, args.truncate)
    except KeyboardInterrupt:
        print("Interrompido pelo usuário.")
        sys.exit(1)


if __name__ == "__main__":
    main()
