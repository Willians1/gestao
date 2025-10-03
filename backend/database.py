from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import shutil

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


def _maybe_bootstrap_from_seed(db_path: str):
	"""Se o arquivo SQLite não existir ainda, tenta copiar de um seed.

	Controlado por variáveis:
	  - SQLITE_BOOTSTRAP (default: "1") → se "0", não faz nada
	  - SQLITE_SEED_FILE (opcional) → caminho absoluto/relativo para seed
	Fallback do seed: backend/seed_template/gestao_obras_seed.db

	Critérios:
	  - Só executa se o arquivo alvo não existir.
	  - Se seed não existir ou erro de cópia, apenas registra e segue (DB
		será criado vazio pelo SQLAlchemy depois).
	"""
	if os.path.exists(db_path):  # Já existe — nada a fazer
		return
	if os.getenv("SQLITE_BOOTSTRAP", "1") == "0":
		return
	base_dir = os.path.dirname(os.path.abspath(__file__))
	seed_candidate = os.getenv("SQLITE_SEED_FILE") or os.path.join(base_dir, "seed_template", "gestao_obras_seed.db")
	try:
		if os.path.exists(seed_candidate):
			os.makedirs(os.path.dirname(db_path), exist_ok=True)
			shutil.copy2(seed_candidate, db_path)
			print(f"[SQLITE][BOOTSTRAP] Copiado seed inicial: {seed_candidate} -> {db_path}")
		else:
			print(f"[SQLITE][BOOTSTRAP] Seed não encontrado ({seed_candidate}); prosseguindo com DB vazio.")
	except Exception as e:
		print(f"[SQLITE][BOOTSTRAP][WARN] Falha ao copiar seed: {e}")


def _build_sqlite_url():
	data_dir = _pick_writable_dir()
	file_name = os.getenv("DB_FILE", "gestao_obras.db")
	db_path = os.path.join(data_dir, file_name)
	# Bootstrap antes de criar engine
	_maybe_bootstrap_from_seed(db_path)
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
