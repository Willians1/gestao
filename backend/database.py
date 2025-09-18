from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os


def _pick_writable_dir() -> str:
	"""Seleciona um diretório gravável para armazenar o banco SQLite.

	Ordem de preferência:
	1) Variáveis de ambiente DB_DIR ou DATA_DIR
	2) /var/data (padrão comum em PaaS com disco)
	3) /data
	4) Diretório local backend/data
	5) /tmp (ephemeral)
	"""
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
	# Fallback bruto: diretório do backend
	return base_dir


def _build_engine_url():
	# Preferir DATABASE_URL (Postgres no formato postgresql+psycopg://user:pass@host:port/db)
	db_url = os.getenv("DATABASE_URL") or os.getenv("DB_URL")
	if db_url:
		# Render costuma fornecer DATABASE_URL com prefixo postgres://, converter para postgresql+psycopg://
		if db_url.startswith("postgres://"):
			db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
		elif db_url.startswith("postgresql://") and "+" not in db_url:
			db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
		return db_url, None

	# Fallback: SQLite em arquivo gravável
	data_dir = _pick_writable_dir()
	db_path = os.path.join(data_dir, "gestao_obras.db")
	return f"sqlite:///{db_path}", {"check_same_thread": False}


SQLALCHEMY_DATABASE_URL, CONNECT_ARGS = _build_engine_url()

engine = create_engine(
	SQLALCHEMY_DATABASE_URL,
	connect_args=(CONNECT_ARGS or {}),
	echo=True,
	future=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Expor caminhos úteis (para backups SQLite, se aplicável)
try:
	DB_PATH = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "") if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else None
except Exception:
	DB_PATH = None
