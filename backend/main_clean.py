from fastapi import File, UploadFile, FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
import shutil
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
import os
import pandas as pd
import io
import uvicorn
import json
import hashlib


# App e DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3005",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3005",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip para respostas mais leves
app.add_middleware(GZipMiddleware, minimum_size=500)

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

# --- CRUD Endpoints ---
# Usuários
class UsuarioSchema(BaseModel):
    id: int | None = None
    username: str
    nome: str | None = None
    email: str | None = None
    nivel_acesso: str = 'visualizacao'  # admin, willians, manutencao, visualizacao
    ativo: bool = True
    # grupo_id: int | None = None
    # permissoes: list[str] | None = None  # Lista de permissões específicas
    model_config = ConfigDict(from_attributes=True)

class UsuarioCreateSchema(BaseModel):
    username: str
    password: str
    nome: str
    email: str | None = None
    nivel_acesso: str = 'visualizacao'  # admin, willians, manutencao, visualizacao
    ativo: bool = True
    # grupo_id: int | None = None
    # permissoes: list[str] | None = None  # Lista de permissões específicas

class UsuarioUpdateSchema(BaseModel):
    username: str
    password: str | None = None  # Opcional para updates
    nome: str
    email: str | None = None
    nivel_acesso: str = 'visualizacao'  # admin, willians, manutencao, visualizacao
    ativo: bool = True
    # grupo_id: int | None = None

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
        # grupo_id=usuario.grupo_id,
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
    # db_usuario.grupo_id = usuario.grupo_id
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

# Endpoint básico para testar o servidor
@app.get("/")
def root():
    return {"message": "API de Gestão de Obras funcionando!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
