from fastapi import File, UploadFile, FastAPI, Depends, HTTPException, status, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import shutil
import uuid
import sys
sys.path.append(os.path.dirname(__file__))
from database import SessionLocal, engine
from models import (
    Base,
    Usuario,
    Cliente,
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
    GrupoUsuario,
    PermissaoSistema,
    PermissaoGrupo,
    Loja,
    LojaGrupo,
)
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from jose import jwt, JWTError
import datetime
import asyncio
import os
import pandas as pd
import io
import uvicorn
import json
import hashlib
import zipfile
from pathlib import Path


# App e DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(bind=engine)

# Garante índices importantes para desempenho
def ensure_indexes():
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username)"))
            # Adiciona coluna grupo_id se não existir (SQLite permite ADD COLUMN)
            try:
                res = conn.execute(text("PRAGMA table_info(usuarios)"))
                cols = [row[1] for row in res.fetchall()]
                if "grupo_id" not in cols:
                    conn.execute(text("ALTER TABLE usuarios ADD COLUMN grupo_id INTEGER"))
            except Exception:
                pass
    except Exception:
        # Se falhar (ex.: permissão ou DB read-only), segue sem interromper o app
        pass

ensure_indexes()

# Garante permissões padrão do sistema (IDs fixos usados no frontend)
def ensure_system_permissions():
    DEFAULT_PERMISSIONS = [
        # Sistema
        {"id": 1001, "nome": "Dashboard", "categoria": "Sistema"},
        {"id": 1002, "nome": "Relatórios", "categoria": "Sistema"},
        {"id": 1003, "nome": "Análises", "categoria": "Sistema"},
        {"id": 1004, "nome": "Administração do Sistema", "categoria": "Sistema"},
        {"id": 1005, "nome": "Backup", "categoria": "Sistema"},
        # Cadastros - Usuários
        {"id": 1101, "nome": "Usuários", "categoria": "Cadastros"},
        {"id": 1102, "nome": "Usuários - Alterar", "categoria": "Cadastros"},
        {"id": 1103, "nome": "Usuários - Excluir", "categoria": "Cadastros"},
        {"id": 1104, "nome": "Usuários - Criar", "categoria": "Cadastros"},
        # Cadastros - Clientes
        {"id": 1201, "nome": "Clientes", "categoria": "Cadastros"},
        {"id": 1202, "nome": "Clientes - Alterar", "categoria": "Cadastros"},
        {"id": 1203, "nome": "Clientes - Excluir", "categoria": "Cadastros"},
        {"id": 1204, "nome": "Clientes - Criar/Importar", "categoria": "Cadastros"},
        # Cadastros - Fornecedores
        {"id": 1301, "nome": "Fornecedores", "categoria": "Cadastros"},
        {"id": 1302, "nome": "Fornecedores - Alterar", "categoria": "Cadastros"},
        {"id": 1303, "nome": "Fornecedores - Excluir", "categoria": "Cadastros"},
        {"id": 1304, "nome": "Fornecedores - Criar/Importar", "categoria": "Cadastros"},
        # Obras - Contratos
        {"id": 1401, "nome": "Contratos", "categoria": "Obras"},
        {"id": 1402, "nome": "Contratos - Alterar", "categoria": "Obras"},
        {"id": 1403, "nome": "Contratos - Excluir", "categoria": "Obras"},
        {"id": 1404, "nome": "Contratos - Criar/Importar", "categoria": "Obras"},
        # Obras - Orçamento
        {"id": 1501, "nome": "Orçamento de Obra", "categoria": "Obras"},
        {"id": 1502, "nome": "Orçamento - Alterar", "categoria": "Obras"},
        {"id": 1503, "nome": "Orçamento - Excluir", "categoria": "Obras"},
        {"id": 1504, "nome": "Orçamento - Criar/Importar", "categoria": "Obras"},
        # Financeiro - Despesas
        {"id": 1601, "nome": "Despesas", "categoria": "Financeiro"},
        {"id": 1602, "nome": "Despesas - Alterar", "categoria": "Financeiro"},
        {"id": 1603, "nome": "Despesas - Excluir", "categoria": "Financeiro"},
        {"id": 1604, "nome": "Despesas - Criar/Importar", "categoria": "Financeiro"},
        # Materiais
        {"id": 1701, "nome": "Valor Materiais", "categoria": "Materiais"},
        {"id": 1702, "nome": "Valor Materiais - Alterar", "categoria": "Materiais"},
        {"id": 1703, "nome": "Valor Materiais - Excluir", "categoria": "Materiais"},
        {"id": 1704, "nome": "Valor Materiais - Criar/Importar", "categoria": "Materiais"},
        # Relatórios
        {"id": 1801, "nome": "Resumo Mensal", "categoria": "Relatórios"},
        {"id": 1802, "nome": "Resumo Mensal - Alterar", "categoria": "Relatórios"},
        {"id": 1803, "nome": "Resumo Mensal - Excluir", "categoria": "Relatórios"},
        {"id": 1804, "nome": "Resumo Mensal - Criar/Importar", "categoria": "Relatórios"},
        # Lojas
        {"id": 1901, "nome": "Acesso a Todas as Lojas", "categoria": "Lojas"},
        {"id": 1902, "nome": "Acesso a Loja Individual", "categoria": "Lojas"},
        {"id": 1903, "nome": "Gerenciar Lojas", "categoria": "Lojas"},
    ]
    db = SessionLocal()
    try:
        for p in DEFAULT_PERMISSIONS:
            existing = db.query(PermissaoSistema).filter(PermissaoSistema.id == p["id"]).first()
            if not existing:
                db.add(PermissaoSistema(id=p["id"], nome=p["nome"], categoria=p["categoria"], ativo=True))
            else:
                # Mantém IDs fixos e atualiza nome/categoria se mudarem
                changed = False
                if existing.nome != p["nome"]:
                    existing.nome = p["nome"]; changed = True
                if existing.categoria != p["categoria"]:
                    existing.categoria = p["categoria"]; changed = True
                if existing.ativo is False:
                    existing.ativo = True; changed = True
                if changed:
                    db.add(existing)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

ensure_system_permissions()

app = FastAPI()

# Registro de início da aplicação para cálculo de uptime
APP_START_TIME_UTC = datetime.datetime.utcnow()

def _get_build_meta():
    """Coleta metadados de build a partir de variáveis de ambiente.

    Compatível com Render (RENDER_GIT_COMMIT) e variáveis genéricas.
    """
    return {
        "version": os.getenv("APP_VERSION"),
        "commit_sha": os.getenv("RENDER_GIT_COMMIT") or os.getenv("COMMIT_SHA") or os.getenv("GIT_COMMIT"),
        "build_time": os.getenv("BUILD_TIME"),  # ISO 8601 recomendado
    }

# Health check super-rápido (sem tocar no banco)
@app.get("/healthz")
def healthz():
    meta = _get_build_meta()
    # Cálculo de uptime em segundos (desde o start do processo)
    uptime_seconds = (datetime.datetime.utcnow() - APP_START_TIME_UTC).total_seconds()
    return {
        "status": "ok",
        "version": meta.get("version"),
        "commit_sha": meta.get("commit_sha"),
        "build_time": meta.get("build_time"),
        "uptime_seconds": int(uptime_seconds),
    }

# CORS
origins_env = os.getenv(
    "ALLOW_ORIGINS",
    ",".join([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3005",
        # Hosts de frontend em produção
        "https://gestao-frontend.onrender.com",
        "https://gestao-frontend-ttgd.onrender.com",
    ]),
)
allow_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip para respostas mais leves
app.add_middleware(GZipMiddleware, minimum_size=500)

# Configurar diretórios de upload
UPLOAD_DIR = "uploads"
TESTES_LOJA_DIR = os.path.join(UPLOAD_DIR, "testes-loja")
TESTES_AR_CONDICIONADO_DIR = os.path.join(UPLOAD_DIR, "testes-ar-condicionado")

# Criar diretórios se não existirem
os.makedirs(TESTES_LOJA_DIR, exist_ok=True)
os.makedirs(TESTES_AR_CONDICIONADO_DIR, exist_ok=True)

# Configurar arquivos estáticos
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Diretório de backups
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
BACKUP_DIR = os.path.join(BACKEND_DIR, "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

# Helpers de backup
STATE_FILE = os.path.join(BACKUP_DIR, "state.json")
PROGRESS_FILE = os.path.join(BACKUP_DIR, "progress.json")
CANCEL_FILE = os.path.join(BACKUP_DIR, "cancel.flag")
EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    ".cache",
    ".parcel-cache",
    "dist",
    "build",
    ".next",
    "backups",  # evita incluir os próprios backups
}
EXCLUDE_FILES_SUFFIX = {".pyc", ".pyo", ".log"}

def load_backup_state():
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("last_backup_at"):
                    data["last_backup_at"] = datetime.datetime.fromisoformat(data["last_backup_at"])  # type: ignore
                return data
    except Exception:
        pass
    return {"last_backup_at": None}

def save_backup_state(state: dict):
    data = state.copy()
    if isinstance(data.get("last_backup_at"), (datetime.datetime,)):
        data["last_backup_at"] = data["last_backup_at"].isoformat()
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def list_backup_files():
    files = []
    for name in os.listdir(BACKUP_DIR):
        if name.lower().endswith(".zip"):
            p = os.path.join(BACKUP_DIR, name)
            try:
                stat = os.stat(p)
                files.append({
                    "name": name,
                    "path": p,
                    "size": stat.st_size,
                    "created": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })
            except OSError:
                continue
    files.sort(key=lambda x: x["created"], reverse=True)
    return files

def should_exclude(rel_path: str) -> bool:
    parts = Path(rel_path).parts
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True
    for suf in EXCLUDE_FILES_SUFFIX:
        if rel_path.endswith(suf):
            return True
    return False

def make_backup_zip() -> str:
    now = datetime.datetime.now()
    stamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    zip_name = f"backup_{stamp}.zip"
    zip_path = os.path.join(BACKUP_DIR, zip_name)
    inprogress = zip_path + ".inprogress"
    # Evitar concorrência
    if os.path.exists(inprogress):
        raise HTTPException(status_code=409, detail="Backup já em andamento")
    open(inprogress, "w").close()
    try:
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            for root, dirs, files in os.walk(ROOT_DIR):
                rel_root = os.path.relpath(root, ROOT_DIR)
                if rel_root == ".":
                    rel_root = ""
                # Filtrar dirs in-place para acelerar
                dirs[:] = [d for d in dirs if not should_exclude(os.path.join(rel_root, d))]
                for fn in files:
                    rel_fp = os.path.join(rel_root, fn)
                    if should_exclude(rel_fp):
                        continue
                    abs_fp = os.path.join(ROOT_DIR, rel_fp)
                    # Segurança: garantir que está dentro do ROOT_DIR
                    if not os.path.abspath(abs_fp).startswith(ROOT_DIR):
                        continue
                    zf.write(abs_fp, arcname=rel_fp)
        # Atualiza estado
        state = load_backup_state()
        state["last_backup_at"] = now
        save_backup_state(state)
        return zip_name
    finally:
        try:
            os.remove(inprogress)
        except OSError:
            pass

def collect_backup_candidates() -> list[str]:
    candidates: list[str] = []
    for root, dirs, files in os.walk(ROOT_DIR):
        rel_root = os.path.relpath(root, ROOT_DIR)
        if rel_root == ".":
            rel_root = ""
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(rel_root, d))]
        for fn in files:
            rel_fp = os.path.join(rel_root, fn)
            if should_exclude(rel_fp):
                continue
            candidates.append(rel_fp)
    return candidates

def load_progress():
    try:
        if os.path.exists(PROGRESS_FILE):
            with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        return None
    return None

def save_progress(data: dict | None):
    if data is None:
        try:
            if os.path.exists(PROGRESS_FILE):
                os.remove(PROGRESS_FILE)
        except OSError:
            pass
        return
    tmp = data.copy()
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(tmp, f, ensure_ascii=False)

def set_cancel():
    try:
        open(CANCEL_FILE, "w").close()
    except Exception:
        pass

def clear_cancel():
    try:
        if os.path.exists(CANCEL_FILE):
            os.remove(CANCEL_FILE)
    except OSError:
        pass

def is_canceled() -> bool:
    return os.path.exists(CANCEL_FILE)

async def backup_worker_async():
    now = datetime.datetime.now()
    stamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    zip_name = f"backup_{stamp}.zip"
    zip_path = os.path.join(BACKUP_DIR, zip_name)
    inprogress = zip_path + ".inprogress"
    if os.path.exists(inprogress):
        raise HTTPException(status_code=409, detail="Backup já em andamento")
    open(inprogress, "w").close()
    canceled = False
    try:
        files = collect_backup_candidates()
        total = len(files)
        processed = 0
        save_progress({"running": True, "percent": 0, "processed": 0, "total": total, "current": None, "file": zip_name, "canceled": False})
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            for rel_fp in files:
                if is_canceled():
                    canceled = True
                    break
                abs_fp = os.path.join(ROOT_DIR, rel_fp)
                if not os.path.abspath(abs_fp).startswith(ROOT_DIR):
                    continue
                try:
                    zf.write(abs_fp, arcname=rel_fp)
                except Exception:
                    # ignora arquivo com erro
                    pass
                processed += 1
                if processed % 20 == 0 or processed == total:
                    percent = 0 if total == 0 else round(processed * 100 / total, 2)
                    save_progress({"running": True, "percent": percent, "processed": processed, "total": total, "current": rel_fp, "file": zip_name, "canceled": False})
                    await asyncio.sleep(0)
        if canceled:
            # remover zip parcial
            try:
                if os.path.exists(zip_path):
                    os.remove(zip_path)
            except OSError:
                pass
        else:
            # Finaliza com sucesso
            state = load_backup_state()
            state["last_backup_at"] = now
            save_backup_state(state)
            rotate_backups(keep=7)
    finally:
        # Marca estado final (sucesso 100% ou cancelado com percent atual)
        try:
            p = load_progress() or {}
            if canceled:
                save_progress({
                    "running": False,
                    "percent": float(p.get("percent") or 0),
                    "processed": int(p.get("processed") or 0),
                    "total": int(p.get("total") or 0),
                    "current": None,
                    "file": p.get("file"),
                    "canceled": True
                })
            else:
                total = int(p.get("total") or 0)
                save_progress({
                    "running": False,
                    "percent": 100.0,
                    "processed": total,
                    "total": total,
                    "current": None,
                    "file": p.get("file"),
                    "canceled": False
                })
        except Exception:
            pass
        try:
            os.remove(inprogress)
        except OSError:
            pass
        clear_cancel()

def rotate_backups(keep: int = 7):
    files = list_backup_files()
    if len(files) <= keep:
        return
    for f in files[keep:]:
        try:
            os.remove(os.path.join(BACKUP_DIR, f["name"]))
        except OSError:
            continue

async def schedule_backup_task():
    # Tarefa que agenda backup diariamente às 22:00
    while True:
        now = datetime.datetime.now()
        target = now.replace(hour=22, minute=0, second=0, microsecond=0)
        if now >= target:
            target = target + datetime.timedelta(days=1)
        wait_seconds = (target - now).total_seconds()
        try:
            await asyncio.sleep(wait_seconds)
            make_backup_zip()
            rotate_backups(keep=7)
        except Exception:
            # Não interromper o laço por erro
            await asyncio.sleep(5)

@app.on_event("startup")
async def _startup_schedule():
    # Evitar múltiplas tarefas em reload: usar um flag global
    if not getattr(app.state, "_backup_task_started", False):
        app.state._backup_task_started = True
        asyncio.create_task(schedule_backup_task())

# Configurações de Segurança
SECRET_KEY = os.getenv("SECRET_KEY", "secret-key-thors-gestor-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Schemas de Autenticação ---
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    nome: str
    email: Optional[str] = None
    nivel_acesso: str
    ativo: bool
    is_admin: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# --- Funções de Autenticação ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: Usuario = Depends(get_current_user)):
    if current_user.nivel_acesso != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem acessar esta funcionalidade."
        )
    return current_user

def require_maintenance_or_admin(current_user: Usuario = Depends(get_current_user)):
    if current_user.nivel_acesso not in ["Admin", "Manutenção"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas usuários de Manutenção ou Administradores podem acessar esta funcionalidade."
        )
    return current_user

# --- Schemas ---
class ClienteCreateSchema(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    email: Optional[str] = None
    contato: Optional[str] = None
    endereco: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ClienteSchema(BaseModel):
    id: Optional[int] = None
    nome: str
    cnpj: Optional[str] = None
    email: Optional[str] = None
    contato: Optional[str] = None
    endereco: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class FornecedorSchema(BaseModel):
    id: Optional[int]
    nome: str
    cnpj: Optional[str]
    contato: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class OrcamentoObraSchema(BaseModel):
    id: Optional[int]
    cliente_id: int
    etapa: str
    descricao: str
    unidade: str
    quantidade: float
    custo_unitario: float
    data: Optional[datetime.date]
    model_config = ConfigDict(from_attributes=True)

class DespesaSchema(BaseModel):
    id: Optional[int] = None
    id_cliente: Optional[int] = None  # Novo campo principal
    cliente_id: Optional[int] = None  # Mantido para compatibilidade
    servico: Optional[str] = None  # Novo campo principal
    descricao: Optional[str] = None  # Mantido para compatibilidade
    valor: float
    data: Optional[datetime.date] = None
    categoria: Optional[str] = None  # Novo campo
    status: Optional[str] = 'Pendente'  # Novo campo
    observacoes: Optional[str] = None  # Novo campo
    model_config = ConfigDict(from_attributes=True)

class ContratoSchema(BaseModel):
    id: Optional[int] = None
    numero: str
    cliente_id: int
    cliente: Optional[str] = None  # Nome do cliente para compatibilidade
    valor: float
    dataInicio: Optional[datetime.date] = None
    dataFim: Optional[datetime.date] = None
    tipo: Optional[str] = None
    situacao: Optional[str] = None
    prazoPagamento: Optional[str] = None
    quantidadeParcelas: Optional[str] = None
    arquivo: Optional[str] = None
    arquivo_upload_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ValorMaterialSchema(BaseModel):
    id: Optional[int] = None
    cliente_id: Optional[int] = None  # Cliente específico (opcional)
    descricao_produto: str
    marca: str = ""
    unidade_medida: str = ""
    valor_unitario: float
    estoque_atual: int = 0
    estoque_minimo: int = 0
    data_ultima_entrada: str = ""
    responsavel: str = ""
    fornecedor: str = ""
    valor: Optional[float] = None
    localizacao: str = ""
    observacoes: str = ""
    model_config = ConfigDict(from_attributes=True)

class ResumoMensalSchema(BaseModel):
    id: Optional[int]
    cliente_id: int
    mes: str
    ano: int
    total_despesas: float
    total_orcamento: float
    model_config = ConfigDict(from_attributes=True)

class ArquivoImportadoSchema(BaseModel):
    id: int | None = None
    nome: str
    entidade: str
    tamanho: int
    # Alinhado com models.ArquivoImportado.criado_em (DateTime)
    # Em Pydantic v2, datetime é serializado automaticamente em ISO 8601
    criado_em: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

class TabelaImportadaSchema(BaseModel):
    id: int | None = None
    entidade: str
    dados: list
    upload_id: int | None = None
    criado_em: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

class TesteLojaSchema(BaseModel):
    id: int | None = None
    data_teste: datetime.date
    cliente_id: int
    horario: datetime.time
    foto: str | None = None
    video: str | None = None
    status: str  # 'OK' ou 'OFF'
    observacao: str | None = None
    criado_em: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

class TesteLojaCreateSchema(BaseModel):
    data_teste: datetime.date
    cliente_id: int
    horario: datetime.time
    status: str
    observacao: str | None = None

class TesteArCondicionadoSchema(BaseModel):
    id: int | None = None
    data_teste: datetime.date
    cliente_id: int
    horario: datetime.time
    foto: str | None = None
    video: str | None = None
    status: str  # 'OK' ou 'OFF'
    observacao: str | None = None
    criado_em: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

class TesteArCondicionadoCreateSchema(BaseModel):
    data_teste: datetime.date
    cliente_id: int
    horario: datetime.time
    status: str
    observacao: str | None = None

# --- Schemas de Backup ---
class BackupStatus(BaseModel):
    last_backup_at: Optional[datetime.datetime]
    pending: bool
    hours_since: Optional[float]
    days_since: Optional[float]
    backups_count: int
    over_limit: bool
    files: list

class DeleteBackupsRequest(BaseModel):
    files: List[str]

# --- Endpoints de Backup ---
@app.get("/backup/status", response_model=BackupStatus)
def backup_status(current_user: Usuario = Depends(require_admin)):
    state = load_backup_state()
    last = state.get("last_backup_at")
    now = datetime.datetime.now()
    hours_since = None
    days_since = None
    if last:
        delta = now - last
        hours_since = round(delta.total_seconds() / 3600, 2)
        days_since = round(delta.total_seconds() / 86400, 2)
    files = list_backup_files()
    # Considera pendente se passou do horário de 22:00 do último dia sem backup
    pending = False
    if last is None:
        pending = True
    else:
        # Limiares: 22h do dia
        today_22 = now.replace(hour=22, minute=0, second=0, microsecond=0)
        if now >= today_22:
            # Depois das 22h de hoje, pendente se não houve backup desde 22h de hoje
            pending = last < today_22
        else:
            # Antes das 22h de hoje, pendente se não houve backup desde 22h de ontem
            yesterday_22 = today_22 - datetime.timedelta(days=1)
            pending = last < yesterday_22
    over_limit = len(files) > 7
    return BackupStatus(
        last_backup_at=last,
        pending=pending,
        hours_since=hours_since,
        days_since=days_since,
        backups_count=len(files),
        over_limit=over_limit,
        files=files,
    )

@app.post("/backup/run")
def run_backup(background_tasks: BackgroundTasks, current_user: Usuario = Depends(require_admin)):
    # dispara tarefa em background com progresso
    # se já houver progresso em andamento, retornar 409
    progress = load_progress()
    if progress and progress.get("running"):
        raise HTTPException(status_code=409, detail="Backup em andamento")
    # iniciar tarefa
    background_tasks.add_task(backup_worker_async)
    return {"message": "Backup iniciado"}

@app.get("/backup/list")
def list_backups(current_user: Usuario = Depends(require_admin)):
    return list_backup_files()

@app.get("/backup/download/{filename}")
def download_backup(filename: str, current_user: Usuario = Depends(require_admin)):
    safe_name = os.path.basename(filename)
    path = os.path.join(BACKUP_DIR, safe_name)
    if not os.path.exists(path) or not path.startswith(BACKUP_DIR):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    def iterfile():
        with open(path, "rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                yield chunk

    return StreamingResponse(iterfile(), media_type="application/zip", headers={
        "Content-Disposition": f"attachment; filename={safe_name}"
    })

@app.delete("/backup")
def delete_backups(payload: DeleteBackupsRequest, current_user: Usuario = Depends(require_admin)):
    deleted = []
    for name in payload.files:
        safe_name = os.path.basename(name)
        path = os.path.join(BACKUP_DIR, safe_name)
        if os.path.exists(path) and path.startswith(BACKUP_DIR):
            try:
                os.remove(path)
                deleted.append(safe_name)
            except OSError:
                continue
    return {"deleted": deleted}

@app.get("/backup/progress")
def backup_progress(current_user: Usuario = Depends(require_admin)):
    p = load_progress() or {}
    running = bool(p.get("running"))
    percent = float(p.get("percent") or 0)
    processed = int(p.get("processed") or 0)
    total = int(p.get("total") or 0)
    current = p.get("current")
    file = p.get("file")
    canceled = bool(p.get("canceled") or False)
    return {"running": running, "percent": percent, "processed": processed, "total": total, "current": current, "file": file, "canceled": canceled}

@app.post("/backup/cancel")
def backup_cancel(current_user: Usuario = Depends(require_admin)):
    # sinaliza cancelamento; worker irá interromper e limpar zip parcial
    if load_progress() and load_progress().get("running"):
        set_cancel()
        return {"message": "Cancelamento solicitado"}
    return {"message": "Nenhum backup em andamento"}

# --- CRUD Endpoints ---
# Usuários
class UsuarioSchema(BaseModel):
    id: int | None = None
    username: str
    nome: str | None = None
    email: str | None = None
    nivel_acesso: str = 'visualizacao'  # admin, willians, manutencao, visualizacao
    ativo: bool = True
    grupo_id: int | None = None
    # permissoes: list[str] | None = None  # Lista de permissões específicas
    model_config = ConfigDict(from_attributes=True)

class UsuarioCreateSchema(BaseModel):
    username: str
    password: str
    nome: str
    email: str | None = None
    nivel_acesso: str = 'visualizacao'  # admin, willians, manutencao, visualizacao
    ativo: bool = True
    grupo_id: int | None = None
    # permissoes: list[str] | None = None  # Lista de permissões específicas

class UsuarioUpdateSchema(BaseModel):
    username: str
    password: str | None = None  # Opcional para updates
    nome: str
    email: str | None = None
    nivel_acesso: str = 'visualizacao'  # admin, willians, manutencao, visualizacao
    ativo: bool = True
    grupo_id: int | None = None

# Grupos de Usuários
class GrupoUsuarioSchema(BaseModel):
    id: int | None = None
    nome: str
    descricao: str | None = None
    status: str = 'Aprovado'
    motivo: str | None = None
    valor_maximo_diario_financeiro: float = 0.00
    preco_venda: float = 0.00
    plano_contas: float = 0.00
    valor_maximo_movimentacao: float = 0.00
    valor_maximo_solicitacao_compra: float = 0.00
    valor_maximo_diario_solicitacao_compra: float = 0.00
    model_config = ConfigDict(from_attributes=True)

class GrupoUsuarioCreateSchema(BaseModel):
    nome: str
    descricao: str | None = None
    status: str = 'Aprovado'
    motivo: str | None = None
    valor_maximo_diario_financeiro: float = 0.00
    preco_venda: float = 0.00
    plano_contas: float = 0.00
    valor_maximo_movimentacao: float = 0.00
    valor_maximo_solicitacao_compra: float = 0.00
    valor_maximo_diario_solicitacao_compra: float = 0.00
    permissoes: List[str] = []
    lojas: List[int] = []
    acesso_total_lojas: bool = False

# Permissões
class PermissaoSistemaSchema(BaseModel):
    id: int | None = None
    nome: str
    descricao: str | None = None
    categoria: str | None = None
    ativo: bool = True
    model_config = ConfigDict(from_attributes=True)

# Lojas
class LojaSchema(BaseModel):
    id: int | None = None
    nome: str
    endereco: str | None = None
    cidade: str | None = None
    ativa: bool = True
    model_config = ConfigDict(from_attributes=True)

class LojaCreateSchema(BaseModel):
    nome: str
    endereco: str | None = None
    cidade: str | None = None
    ativa: bool = True

# --- CRUD Endpoints ---

@app.get("/usuarios/", response_model=List[UsuarioSchema])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

@app.post("/usuarios/", response_model=UsuarioSchema)
def criar_usuario(usuario: UsuarioCreateSchema, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.username == usuario.username).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")
    novo = Usuario(
        username=usuario.username,
        nome=usuario.nome,
        email=usuario.email,
        hashed_password=Usuario.hash_password(usuario.password),
        nivel_acesso=usuario.nivel_acesso,
        ativo=usuario.ativo,
        grupo_id=usuario.grupo_id,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/usuarios/{usuario_id}", response_model=UsuarioSchema)
def editar_usuario(usuario_id: int, usuario: UsuarioUpdateSchema, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    db_usuario.username = usuario.username
    db_usuario.nome = usuario.nome
    db_usuario.email = usuario.email
    # Só atualizar senha se foi fornecida
    if usuario.password:
        db_usuario.hashed_password = Usuario.hash_password(usuario.password)
    db_usuario.nivel_acesso = usuario.nivel_acesso
    db_usuario.ativo = usuario.ativo
    db_usuario.grupo_id = usuario.grupo_id
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@app.delete("/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    db.delete(db_usuario)
    db.commit()
    return {"ok": True}

# Auxiliares de usuários por grupo
@app.get("/grupos/{grupo_id}/usuarios", response_model=List[UsuarioSchema])
def listar_usuarios_por_grupo(grupo_id: int, db: Session = Depends(get_db)):
    return db.query(Usuario).filter(Usuario.grupo_id == grupo_id).all()

class SetGrupoSchema(BaseModel):
    grupo_id: int | None = None

@app.post("/usuarios/{usuario_id}/set-grupo", response_model=UsuarioSchema)
def set_grupo_usuario(usuario_id: int, payload: SetGrupoSchema, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.grupo_id = payload.grupo_id
    db.commit()
    db.refresh(user)
    return user

# Login
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login/", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == request.username).first()
    if not user or not user.verify_password(request.password):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    
    token_data = {
        "sub": user.username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12),
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    # Criar resposta do usuário
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        nome=user.nome,
        email=user.email,
        nivel_acesso=user.nivel_acesso,
        ativo=user.ativo,
        is_admin=(user.nivel_acesso.lower() in ["admin", "willians"])
    )
    
    return Token(
        access_token=token,
        token_type="bearer",
        user=user_response
    )

@app.get("/me/", response_model=UserResponse)
def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    """Obter informações do usuário atual"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        nome=current_user.nome,
        email=current_user.email,
        nivel_acesso=current_user.nivel_acesso,
        ativo=current_user.ativo,
        is_admin=(current_user.nivel_acesso.lower() in ["admin", "willians"])
    )

# Grupos de Usuários
@app.get("/grupos/", response_model=List[GrupoUsuarioSchema])
def list_grupos(db: Session = Depends(get_db)):
    return db.query(GrupoUsuario).all()

@app.post("/grupos/", response_model=GrupoUsuarioSchema)
def create_grupo(grupo: GrupoUsuarioCreateSchema, db: Session = Depends(get_db)):
    db_grupo = GrupoUsuario(
        nome=grupo.nome,
        descricao=grupo.descricao,
        status=grupo.status,
        motivo=grupo.motivo,
        valor_maximo_diario_financeiro=grupo.valor_maximo_diario_financeiro,
        preco_venda=grupo.preco_venda,
        plano_contas=grupo.plano_contas,
        valor_maximo_movimentacao=grupo.valor_maximo_movimentacao,
        valor_maximo_solicitacao_compra=grupo.valor_maximo_solicitacao_compra,
        valor_maximo_diario_solicitacao_compra=grupo.valor_maximo_diario_solicitacao_compra
    )
    # Adicionar o grupo primeiro e fazer o commit para obter o ID
    db.add(db_grupo)
    db.commit()
    db.refresh(db_grupo)
    
    # Processar permissões se fornecidas
    if grupo.permissoes:
        for permissao_id in grupo.permissoes:
            # Converter string para int se necessário
            perm_id = int(permissao_id) if isinstance(permissao_id, str) else permissao_id
            db_permissao_grupo = PermissaoGrupo(
                grupo_id=db_grupo.id,
                permissao_id=perm_id,
                ativo=True
            )
            db.add(db_permissao_grupo)
    
    # Processar lojas se fornecidas
    if grupo.lojas:
        for loja_id in grupo.lojas:
            db_loja_grupo = LojaGrupo(
                grupo_id=db_grupo.id,
                loja_id=loja_id,
                acesso_total=grupo.acesso_total_lojas
            )
            db.add(db_loja_grupo)
            
    db.commit()
    db.refresh(db_grupo)
    return db_grupo

@app.get("/grupos/{grupo_id}", response_model=GrupoUsuarioSchema)
def get_grupo(grupo_id: int, db: Session = Depends(get_db)):
    grupo = db.query(GrupoUsuario).filter(GrupoUsuario.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return grupo

@app.put("/grupos/{grupo_id}", response_model=GrupoUsuarioSchema)
def update_grupo(grupo_id: int, grupo: GrupoUsuarioCreateSchema, db: Session = Depends(get_db)):
    db_grupo = db.query(GrupoUsuario).filter(GrupoUsuario.id == grupo_id).first()
    if not db_grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    
    # Atualizar campos do grupo
    update_data = grupo.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key not in ["permissoes", "lojas"]:
            setattr(db_grupo, key, value)

    # Atualizar permissões
    if "permissoes" in update_data:
        # Limpar permissões existentes
        db.query(PermissaoGrupo).filter(PermissaoGrupo.grupo_id == grupo_id).delete()
        # Adicionar novas permissões
        for permissao_id in update_data["permissoes"]:
            perm_id = int(permissao_id) if isinstance(permissao_id, str) else permissao_id
            db_permissao_grupo = PermissaoGrupo(grupo_id=grupo_id, permissao_id=perm_id, ativo=True)
            db.add(db_permissao_grupo)

    # Atualizar lojas
    if "lojas" in update_data:
        # Limpar lojas existentes
        db.query(LojaGrupo).filter(LojaGrupo.grupo_id == grupo_id).delete()
        # Adicionar novas lojas
        for loja_id in update_data["lojas"]:
            db_loja_grupo = LojaGrupo(grupo_id=grupo_id, loja_id=loja_id, acesso_total=grupo.acesso_total_lojas)
            db.add(db_loja_grupo)

    db.commit()
    db.refresh(db_grupo)
    return db_grupo

@app.delete("/grupos/{grupo_id}")
def delete_grupo(grupo_id: int, db: Session = Depends(get_db)):
    db_grupo = db.query(GrupoUsuario).filter(GrupoUsuario.id == grupo_id).first()
    if not db_grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    db.delete(db_grupo)
    db.commit()
    return {"ok": True}

# Permissões
@app.get("/permissoes/", response_model=List[PermissaoSistemaSchema])
def list_permissoes(db: Session = Depends(get_db)):
    return db.query(PermissaoSistema).all()

# Permissões de Grupo
@app.get("/grupos/{grupo_id}/permissoes/")
def get_grupo_permissoes(grupo_id: int, db: Session = Depends(get_db)):
    # Verificar se o grupo existe
    db_grupo = db.query(GrupoUsuario).filter(GrupoUsuario.id == grupo_id).first()
    if not db_grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    
    # Buscar permissões do grupo
    permissoes_grupo = db.query(PermissaoGrupo).filter(PermissaoGrupo.grupo_id == grupo_id).all()
    permissoes_ids = [pg.permissao_id for pg in permissoes_grupo]
    
    # Buscar detalhes das permissões
    permissoes = db.query(PermissaoSistema).filter(PermissaoSistema.id.in_(permissoes_ids)).all()
    
    return {
        "grupo_id": grupo_id,
        "grupo_nome": db_grupo.nome,
        "permissoes": [
            {
                "id": perm.id,
                "nome": perm.nome,
                "descricao": perm.descricao
            } for perm in permissoes
        ]
    }

# Lojas
@app.get("/lojas/", response_model=List[LojaSchema])
def list_lojas(db: Session = Depends(get_db)):
    return db.query(Loja).all()

@app.post("/lojas/", response_model=LojaSchema)
def create_loja(loja: LojaCreateSchema, db: Session = Depends(get_db)):
    db_loja = Loja(**loja.dict())
    db.add(db_loja)
    db.commit()
    db.refresh(db_loja)
    return db_loja

# Finalizando o arquivo main.py com endpoints de clientes e outras entidades
@app.get("/clientes/", response_model=List[ClienteSchema])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()

@app.post("/clientes/", response_model=ClienteSchema)
def criar_cliente(cliente: ClienteCreateSchema, db: Session = Depends(get_db)):
    novo = Cliente(**cliente.dict())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

# Despesas
@app.get("/despesas/", response_model=List[DespesaSchema])
def listar_despesas(db: Session = Depends(get_db)):
    return db.query(Despesa).all()

@app.get("/despesas", response_model=List[DespesaSchema])
def listar_despesas_alt(db: Session = Depends(get_db)):
    return db.query(Despesa).all()

@app.post("/despesas/", response_model=DespesaSchema)
def criar_despesa(despesa: DespesaSchema, db: Session = Depends(get_db)):
    novo = Despesa(**despesa.dict(exclude_unset=True))
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/despesas/{despesa_id}", response_model=DespesaSchema)
def atualizar_despesa(despesa_id: int, despesa: DespesaSchema, db: Session = Depends(get_db)):
    db_despesa = db.query(Despesa).filter(Despesa.id == despesa_id).first()
    if not db_despesa:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    
    for key, value in despesa.dict(exclude_unset=True).items():
        if key != 'id':
            setattr(db_despesa, key, value)
    
    db.commit()
    db.refresh(db_despesa)
    return db_despesa

@app.delete("/despesas/{despesa_id}")
def deletar_despesa(despesa_id: int, db: Session = Depends(get_db)):
    db_despesa = db.query(Despesa).filter(Despesa.id == despesa_id).first()
    if not db_despesa:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    db.delete(db_despesa)
    db.commit()
    return {"ok": True}

# Resumo Mensal
@app.get("/resumo_mensal/", response_model=List[ResumoMensalSchema])
def listar_resumo_mensal(db: Session = Depends(get_db)):
    return db.query(ResumoMensal).all()

@app.post("/resumo_mensal/", response_model=ResumoMensalSchema)
def criar_resumo_mensal(resumo: ResumoMensalSchema, db: Session = Depends(get_db)):
    novo = ResumoMensal(**resumo.dict(exclude_unset=True))
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/resumo_mensal/{resumo_id}", response_model=ResumoMensalSchema)
def atualizar_resumo_mensal(resumo_id: int, resumo: ResumoMensalSchema, db: Session = Depends(get_db)):
    db_resumo = db.query(ResumoMensal).filter(ResumoMensal.id == resumo_id).first()
    if not db_resumo:
        raise HTTPException(status_code=404, detail="Resumo mensal não encontrado")
    
    for key, value in resumo.dict(exclude_unset=True).items():
        if key != 'id':
            setattr(db_resumo, key, value)
    
    db.commit()
    db.refresh(db_resumo)
    return db_resumo

@app.delete("/resumo_mensal/{resumo_id}")
def deletar_resumo_mensal(resumo_id: int, db: Session = Depends(get_db)):
    db_resumo = db.query(ResumoMensal).filter(ResumoMensal.id == resumo_id).first()
    if not db_resumo:
        raise HTTPException(status_code=404, detail="Resumo mensal não encontrado")
    db.delete(db_resumo)
    db.commit()
    return {"ok": True}

# Fornecedores
@app.get("/fornecedores/", response_model=List[FornecedorSchema])
def listar_fornecedores(db: Session = Depends(get_db)):
    return db.query(Fornecedor).all()

@app.post("/fornecedores/", response_model=FornecedorSchema)
def criar_fornecedor(fornecedor: FornecedorSchema, db: Session = Depends(get_db)):
    novo = Fornecedor(**fornecedor.dict(exclude_unset=True))
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

# Orçamento de Obra
@app.get("/orcamento_obra/", response_model=List[OrcamentoObraSchema])
def listar_orcamento_obra(db: Session = Depends(get_db)):
    return db.query(OrcamentoObra).all()

@app.post("/orcamento_obra/", response_model=OrcamentoObraSchema)
def criar_orcamento_obra(orcamento: OrcamentoObraSchema, db: Session = Depends(get_db)):
    novo = OrcamentoObra(**orcamento.dict(exclude_unset=True))
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

# Contratos
@app.get("/contratos/", response_model=List[ContratoSchema])
def listar_contratos(db: Session = Depends(get_db)):
    return db.query(Contrato).all()

@app.post("/contratos/", response_model=ContratoSchema)
def criar_contrato(contrato: ContratoSchema, db: Session = Depends(get_db)):
    novo = Contrato(**contrato.dict(exclude_unset=True))
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

# Valor de Materiais
@app.get("/valor_materiais/", response_model=List[ValorMaterialSchema])
def listar_valor_materiais(db: Session = Depends(get_db)):
    return db.query(ValorMaterial).all()

@app.post("/valor_materiais/", response_model=ValorMaterialSchema)
def criar_valor_material(material: ValorMaterialSchema, db: Session = Depends(get_db)):
    novo = ValorMaterial(**material.dict(exclude_unset=True))
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

# Testes de Loja
@app.get("/testes-loja/", response_model=List[TesteLojaSchema])
def listar_testes_loja(db: Session = Depends(get_db)):
    return db.query(TesteLoja).all()

@app.post("/testes-loja/", response_model=TesteLojaSchema)
async def criar_teste_loja(
    data_teste: str = Form(...),
    cliente_id: int = Form(...),
    horario: str = Form(...),
    status: str = Form(...),
    observacao: str = Form(None),
    foto: UploadFile = File(None),
    video: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # Criar teste primeiro
    novo_teste = TesteLoja(
        data_teste=datetime.datetime.strptime(data_teste, "%Y-%m-%d").date(),
        cliente_id=cliente_id,
        horario=datetime.datetime.strptime(horario, "%H:%M").time(),
        status=status,
        observacao=observacao
    )
    db.add(novo_teste)
    db.commit()
    db.refresh(novo_teste)
    
    # Salvar arquivos se fornecidos
    if foto:
        file_extension = os.path.splitext(foto.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(TESTES_LOJA_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)
        
        novo_teste.foto = unique_filename
    
    if video:
        file_extension = os.path.splitext(video.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(TESTES_LOJA_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        novo_teste.video = unique_filename
    
    db.commit()
    db.refresh(novo_teste)
    return novo_teste

@app.put("/testes-loja/{teste_id}", response_model=TesteLojaSchema)
async def atualizar_teste_loja(
    teste_id: int,
    data_teste: str = Form(...),
    cliente_id: int = Form(...),
    horario: str = Form(...),
    status: str = Form(...),
    observacao: str = Form(None),
    foto: UploadFile = File(None),
    video: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    teste_db = db.query(TesteLoja).filter(TesteLoja.id == teste_id).first()
    if not teste_db:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    # Atualizar dados básicos
    teste_db.data_teste = datetime.datetime.strptime(data_teste, "%Y-%m-%d").date()
    teste_db.cliente_id = cliente_id
    teste_db.horario = datetime.datetime.strptime(horario, "%H:%M").time()
    teste_db.status = status
    teste_db.observacao = observacao
    
    # Salvar novos arquivos se fornecidos
    if foto and foto.filename:
        # Remover arquivo antigo se existir
        if teste_db.foto:
            old_file_path = os.path.join(TESTES_LOJA_DIR, teste_db.foto)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Salvar novo arquivo
        file_extension = os.path.splitext(foto.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(TESTES_LOJA_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)
        
        teste_db.foto = unique_filename
    
    if video and video.filename:
        # Remover arquivo antigo se existir
        if teste_db.video:
            old_file_path = os.path.join(TESTES_LOJA_DIR, teste_db.video)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Salvar novo arquivo
        file_extension = os.path.splitext(video.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(TESTES_LOJA_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        teste_db.video = unique_filename
    
    db.commit()
    db.refresh(teste_db)
    return teste_db

@app.delete("/testes-loja/{teste_id}")
def deletar_teste_loja(teste_id: int, db: Session = Depends(get_db)):
    teste_db = db.query(TesteLoja).filter(TesteLoja.id == teste_id).first()
    if not teste_db:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    db.delete(teste_db)
    db.commit()
    return {"message": "Teste deletado com sucesso"}

# Testes de Ar Condicionado
@app.get("/testes-ar-condicionado/", response_model=List[TesteArCondicionadoSchema])
def listar_testes_ar_condicionado(db: Session = Depends(get_db)):
    return db.query(TesteArCondicionado).all()

@app.post("/testes-ar-condicionado/", response_model=TesteArCondicionadoSchema)
async def criar_teste_ar_condicionado(
    data_teste: str = Form(...),
    cliente_id: int = Form(...),
    horario: str = Form(...),
    status: str = Form(...),
    observacao: str = Form(None),
    foto: UploadFile = File(None),
    video: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # Criar teste primeiro
    novo_teste = TesteArCondicionado(
        data_teste=datetime.datetime.strptime(data_teste, "%Y-%m-%d").date(),
        cliente_id=cliente_id,
        horario=datetime.datetime.strptime(horario, "%H:%M").time(),
        status=status,
        observacao=observacao
    )
    db.add(novo_teste)
    db.commit()
    db.refresh(novo_teste)
    
    # Salvar arquivos se fornecidos
    if foto:
        file_extension = os.path.splitext(foto.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(TESTES_AR_CONDICIONADO_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)
        
        novo_teste.foto = unique_filename
    
    if video:
        file_extension = os.path.splitext(video.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(TESTES_AR_CONDICIONADO_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        novo_teste.video = unique_filename
    
    db.commit()
    db.refresh(novo_teste)
    return novo_teste

@app.put("/testes-ar-condicionado/{teste_id}", response_model=TesteArCondicionadoSchema)
async def atualizar_teste_ar_condicionado(
    teste_id: int,
    data_teste: str = Form(...),
    cliente_id: int = Form(...),
    horario: str = Form(...),
    status: str = Form(...),
    observacao: str = Form(None),
    foto: UploadFile = File(None),
    video: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    teste_db = db.query(TesteArCondicionado).filter(TesteArCondicionado.id == teste_id).first()
    if not teste_db:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    # Atualizar dados básicos
    teste_db.data_teste = datetime.datetime.strptime(data_teste, "%Y-%m-%d").date()
    teste_db.cliente_id = cliente_id
    teste_db.horario = datetime.datetime.strptime(horario, "%H:%M").time()
    teste_db.status = status
    teste_db.observacao = observacao
    
    # Salvar novos arquivos se fornecidos
    if foto and foto.filename:
        # Remover arquivo antigo se existir
        if teste_db.foto:
            old_file_path = os.path.join(TESTES_AR_CONDICIONADO_DIR, teste_db.foto)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Salvar novo arquivo
        file_extension = os.path.splitext(foto.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(TESTES_AR_CONDICIONADO_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)
        
        teste_db.foto = unique_filename
    
    if video and video.filename:
        # Remover arquivo antigo se existir
        if teste_db.video:
            old_file_path = os.path.join(TESTES_AR_CONDICIONADO_DIR, teste_db.video)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Salvar novo arquivo
        file_extension = os.path.splitext(video.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(TESTES_AR_CONDICIONADO_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        teste_db.video = unique_filename
    
    db.commit()
    db.refresh(teste_db)
    return teste_db

@app.delete("/testes-ar-condicionado/{teste_id}")
def deletar_teste_ar_condicionado(teste_id: int, db: Session = Depends(get_db)):
    teste_db = db.query(TesteArCondicionado).filter(TesteArCondicionado.id == teste_id).first()
    if not teste_db:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    db.delete(teste_db)
    db.commit()
    return {"message": "Teste deletado com sucesso"}

# Rotas de Upload para Testes
@app.post("/upload/testes-loja/foto/{teste_id}")
async def upload_foto_teste_loja(teste_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verificar se o teste existe
    teste = db.query(TesteLoja).filter(TesteLoja.id == teste_id).first()
    if not teste:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    # Gerar nome único para o arquivo
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(TESTES_LOJA_DIR, unique_filename)
    
    # Salvar arquivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Atualizar teste no banco
    teste.foto = unique_filename
    db.commit()
    
    return {"filename": unique_filename, "message": "Foto enviada com sucesso"}

@app.post("/upload/testes-loja/video/{teste_id}")
async def upload_video_teste_loja(teste_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verificar se o teste existe
    teste = db.query(TesteLoja).filter(TesteLoja.id == teste_id).first()
    if not teste:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    # Gerar nome único para o arquivo
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(TESTES_LOJA_DIR, unique_filename)
    
    # Salvar arquivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Atualizar teste no banco
    teste.video = unique_filename
    db.commit()
    
    return {"filename": unique_filename, "message": "Vídeo enviado com sucesso"}

@app.post("/upload/testes-ar-condicionado/foto/{teste_id}")
async def upload_foto_teste_ar_condicionado(teste_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verificar se o teste existe
    teste = db.query(TesteArCondicionado).filter(TesteArCondicionado.id == teste_id).first()
    if not teste:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    # Gerar nome único para o arquivo
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(TESTES_AR_CONDICIONADO_DIR, unique_filename)
    
    # Salvar arquivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Atualizar teste no banco
    teste.foto = unique_filename
    db.commit()
    
    return {"filename": unique_filename, "message": "Foto enviada com sucesso"}

@app.post("/upload/testes-ar-condicionado/video/{teste_id}")
async def upload_video_teste_ar_condicionado(teste_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verificar se o teste existe
    teste = db.query(TesteArCondicionado).filter(TesteArCondicionado.id == teste_id).first()
    if not teste:
        raise HTTPException(status_code=404, detail="Teste não encontrado")
    
    # Gerar nome único para o arquivo
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(TESTES_AR_CONDICIONADO_DIR, unique_filename)
    
    # Salvar arquivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Atualizar teste no banco
    teste.video = unique_filename
    db.commit()
    
    return {"filename": unique_filename, "message": "Vídeo enviado com sucesso"}

# Endpoint básico para testar o servidor
@app.get("/")
def root():
    return {"message": "API de Gestão de Obras funcionando!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
