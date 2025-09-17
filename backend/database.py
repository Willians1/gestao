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


# Caminho final do banco
DATA_DIR = _pick_writable_dir()
DB_PATH = os.path.join(DATA_DIR, "gestao_obras.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
	SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, echo=True, future=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
