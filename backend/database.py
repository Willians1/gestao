from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

"""Módulo de conexão restrito a SQLite.

Removido suporte a Postgres conforme decisão do projeto:
 - Sempre usará SQLite em um diretório gravável.
 - Variáveis aceitas: DB_DIR ou DATA_DIR para definir onde salvar.
 - DB_FILE (opcional) permite trocar o nome do arquivo (default gestao_obras.db).
"""


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


def _build_sqlite_url():
	data_dir = _pick_writable_dir()
	file_name = os.getenv("DB_FILE", "gestao_obras.db")
	db_path = os.path.join(data_dir, file_name)
	return f"sqlite:///{db_path}", {"check_same_thread": False}, db_path


SQLALCHEMY_DATABASE_URL, CONNECT_ARGS, _REAL_DB_PATH = _build_sqlite_url()

engine = create_engine(
	SQLALCHEMY_DATABASE_URL,
	connect_args=CONNECT_ARGS,
	echo=True,
	future=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Expor o caminho real do arquivo SQLite
DB_PATH = _REAL_DB_PATH
