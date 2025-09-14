from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Garante que o banco fique sempre dentro da pasta backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "gestao_obras.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
	SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, echo=True, future=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
