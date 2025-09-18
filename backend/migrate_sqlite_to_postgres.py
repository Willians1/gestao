"""
Migração de dados do SQLite (arquivo) para PostgreSQL (DATABASE_URL).

- Preserva IDs
- Desabilita constraints durante carga (Postgres)
- Ajusta sequences após a carga
- Ordem de tabelas respeitando FKs principais

Uso (PowerShell):

  # Exemplo local: apontando para um arquivo SQLite e um Postgres local
  $env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/gestao_local"
  python backend/migrate_sqlite_to_postgres.py --sqlite backend/gestao_obras.db --truncate

Parâmetros:
  --sqlite <path>   Caminho do arquivo SQLite de origem. Se omitido, tenta descobrir (database.DB_PATH ou backend/gestao_obras.db)
  --pgurl <url>     URL do Postgres de destino. Se omitido, usa a env DATABASE_URL/DB_URL
  --truncate        Limpa os dados do destino antes de inserir (recomendado em bases vazias)
"""
from __future__ import annotations
import argparse
import os
import sys
from typing import List, Type

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Importa modelos e ajuda a criar metadata no destino
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

# Tenta importar DB_PATH para ajudar a localizar o arquivo SQLite de origem
try:
    from database import DB_PATH as API_DB_PATH  # type: ignore
except Exception:
    API_DB_PATH = None


def _normalize_pg_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def infer_sqlite_path(cli_value: str | None) -> str:
    if cli_value:
        return cli_value
    # 1) database.DB_PATH (se a API estiver apontando para SQLite)
    if API_DB_PATH:
        return API_DB_PATH
    # 2) caminho padrão no repo
    candidate = os.path.join(os.path.dirname(__file__), "gestao_obras.db")
    if os.path.exists(candidate):
        return candidate
    # 3) raiz do workspace
    root_candidate = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "gestao_obras.db"))
    if os.path.exists(root_candidate):
        return root_candidate
    raise SystemExit("Arquivo SQLite de origem não encontrado. Informe com --sqlite <path>.")


def infer_pg_url(cli_value: str | None) -> str:
    url = cli_value or os.getenv("DATABASE_URL") or os.getenv("DB_URL")
    if not url:
        raise SystemExit("DATABASE_URL/DB_URL não definida e --pgurl não informado.")
    return _normalize_pg_url(url)


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


def truncate_all(pg: Session):
    # Desabilita constraints para truncar sem ordem
    try:
        pg.execute(text("SET session_replication_role = 'replica';"))
        pg.commit()
    except Exception:
        pg.rollback()
    # Apaga em ordem reversa
    for model in reversed(LOAD_ORDER):
        table = model.__table__
        pg.execute(table.delete())
    pg.commit()
    # Reabilita
    try:
        pg.execute(text("SET session_replication_role = 'origin';"))
        pg.commit()
    except Exception:
        pg.rollback()


def adjust_sequences(pg: Session):
    # Ajusta sequences de id para cada tabela com PK autoincrement
    for model in LOAD_ORDER:
        table_name = model.__tablename__
        try:
            pg.execute(text(
                f"SELECT setval(pg_get_serial_sequence(:t, 'id'), COALESCE(MAX(id), 1)) FROM {table_name}"
            ), {"t": table_name})
            pg.commit()
        except Exception as e:
            pg.rollback()
            print(f"[WARN] Falha ao ajustar sequence de {table_name}: {e}")


def migrate(sqlite_path: str, pg_url: str, do_truncate: bool):
    sqlite_url = f"sqlite:///{os.path.abspath(sqlite_path)}"
    print(f"SQLite origem: {sqlite_url}")
    print(f"Postgres destino: {pg_url}")

    src_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False}, future=True)
    dst_engine = create_engine(pg_url, future=True)

    # Garante schema no destino
    Base.metadata.create_all(bind=dst_engine)

    with Session(src_engine) as src, Session(dst_engine) as dst:
        # Se solicitado, limpa base de destino
        if do_truncate:
            truncate_all(dst)

        # Desabilita constraints para carga
        try:
            dst.execute(text("SET session_replication_role = 'replica';"))
            dst.commit()
        except Exception:
            dst.rollback()

        # Validação: se já existe dado e não truncou, avisa
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
            # Em alguns casos a query pode falhar por schema diferente; continuar mesmo assim
            pass

        # Copia dados na ordem especificada, preservando IDs
        for model in LOAD_ORDER:
            name = model.__tablename__
            rows = src.query(model).all()
            if not rows:
                print(f"{name}: 0 registros (nada a fazer)")
                continue

            # Converte ORM object -> dict simples (colunas)
            to_insert = []
            cols = [c.name for c in model.__table__.columns]
            for obj in rows:
                data = {c: getattr(obj, c) for c in cols}
                to_insert.append(data)

            # Inserção em lote usando INSERT
            dst.execute(model.__table__.insert(), to_insert)
            dst.commit()
            print(f"{name}: migrados {len(to_insert)} registros")

        # Reabilita constraints e ajusta sequences
        try:
            dst.execute(text("SET session_replication_role = 'origin';"))
            dst.commit()
        except Exception:
            dst.rollback()

        adjust_sequences(dst)

    print("Concluído com sucesso.")


def main():
    parser = argparse.ArgumentParser(description="Migrar dados do SQLite para Postgres")
    parser.add_argument("--sqlite", dest="sqlite_path", help="Caminho do arquivo SQLite de origem", default=None)
    parser.add_argument("--pgurl", dest="pg_url", help="URL do Postgres de destino", default=None)
    parser.add_argument("--truncate", dest="truncate", help="Limpar destino antes de inserir", action="store_true")
    args = parser.parse_args()

    sqlite_path = infer_sqlite_path(args.sqlite_path)
    pg_url = infer_pg_url(args.pg_url)

    try:
        migrate(sqlite_path, pg_url, args.truncate)
    except KeyboardInterrupt:
        print("Interrompido pelo usuário.")
        sys.exit(1)


if __name__ == "__main__":
    main()
