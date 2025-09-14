from fastapi import File, UploadFile, FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import os
import shutil
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
)
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from jose import jwt
import datetime
import os
import pandas as pd
import io
import uvicorn
import json


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

SECRET_KEY = os.getenv("SECRET_KEY", "secret-key-exemplo")
ALGORITHM = "HS256"

# --- Schemas ---
class ClienteSchema(BaseModel):
    id: Optional[int]
    nome: str
    cnpj: Optional[str]
    endereco: Optional[str]
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
    id: Optional[int]
    cliente_id: int
    descricao: str
    valor: float
    data: Optional[datetime.date]
    model_config = ConfigDict(from_attributes=True)

class ContratoSchema(BaseModel):
    id: Optional[int] = None
    numero: str
    cliente: str
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
    id: Optional[int]
    nome: str
    unidade: str
    valor: float
    fornecedor_id: int
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

# --- CRUD Endpoints ---
# Usuários
class UsuarioSchema(BaseModel):
    id: int | None = None
    username: str
    is_admin: bool = False
    model_config = ConfigDict(from_attributes=True)

class UsuarioCreateSchema(BaseModel):
    username: str
    password: str
    is_admin: bool = False

@app.get("/usuarios/", response_model=List[UsuarioSchema])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

@app.post("/usuarios/", response_model=UsuarioSchema)
def criar_usuario(usuario: UsuarioCreateSchema, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.username == usuario.username).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")
    novo = Usuario(
        username=usuario.username,
        hashed_password=Usuario.hash_password(usuario.password),
        is_admin=usuario.is_admin,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.put("/usuarios/{usuario_id}", response_model=UsuarioSchema)
def editar_usuario(usuario_id: int, usuario: UsuarioCreateSchema, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    db_usuario.username = usuario.username
    db_usuario.hashed_password = Usuario.hash_password(usuario.password)
    db_usuario.is_admin = usuario.is_admin
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

@app.post("/login/")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == request.username).first()
    if not user or not user.verify_password(request.password):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    token_data = {
        "sub": user.username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12),
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token}

# Clientes
@app.post("/clientes/", response_model=ClienteSchema)
def create_cliente(cliente: ClienteSchema, db: Session = Depends(get_db)):
    db_cliente = Cliente(nome=cliente.nome, cnpj=cliente.cnpj, endereco=cliente.endereco)
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@app.get("/clientes/", response_model=List[ClienteSchema])
def list_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()

@app.get("/clientes/{cliente_id}", response_model=ClienteSchema)
def get_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente

@app.put("/clientes/{cliente_id}", response_model=ClienteSchema)
def update_cliente(cliente_id: int, cliente: ClienteSchema, db: Session = Depends(get_db)):
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    db_cliente.nome = cliente.nome
    db_cliente.cnpj = cliente.cnpj
    db_cliente.endereco = cliente.endereco
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@app.delete("/clientes/{cliente_id}")
def delete_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    db.delete(db_cliente)
    db.commit()
    return {"ok": True}

# Fornecedores
@app.post("/fornecedores/", response_model=FornecedorSchema)
def create_fornecedor(fornecedor: FornecedorSchema, db: Session = Depends(get_db)):
    db_forn = Fornecedor(nome=fornecedor.nome, cnpj=fornecedor.cnpj, contato=fornecedor.contato)
    db.add(db_forn)
    db.commit()
    db.refresh(db_forn)
    return db_forn

@app.get("/fornecedores/", response_model=List[FornecedorSchema])
def list_fornecedores(db: Session = Depends(get_db)):
    return db.query(Fornecedor).all()

# Orçamento Obra
@app.post("/orcamento_obra/", response_model=OrcamentoObraSchema)
def create_orcamento(orcamento: OrcamentoObraSchema, db: Session = Depends(get_db)):
    db_orc = OrcamentoObra(**orcamento.dict())
    db.add(db_orc)
    db.commit()
    db.refresh(db_orc)
    return db_orc

@app.get("/orcamento_obra/", response_model=List[OrcamentoObraSchema])
def list_orcamentos(db: Session = Depends(get_db)):
    return db.query(OrcamentoObra).all()

# Despesas
@app.post("/despesas/", response_model=DespesaSchema)
def create_despesa(despesa: DespesaSchema, db: Session = Depends(get_db)):
    db_desp = Despesa(**despesa.dict())
    db.add(db_desp)
    db.commit()
    db.refresh(db_desp)
    return db_desp

@app.get("/despesas/", response_model=List[DespesaSchema])
def list_despesas(db: Session = Depends(get_db)):
    return db.query(Despesa).all()

# Contratos
@app.post("/contratos/", response_model=ContratoSchema)
def create_contrato(
    numero: str = Form(...),
    cliente: str = Form(...),
    valor: float = Form(...),
    dataInicio: str = Form(...),
    dataFim: str = Form(...),
    tipo: str = Form(...),
    situacao: str = Form(...),
    prazoPagamento: str = Form(...),
    quantidadeParcelas: int = Form(...),
    arquivo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # Processar arquivo se fornecido: salvar em ArquivoImportado e associar ao contrato
    arquivo_nome = None
    arquivo_upload_id = None
    if arquivo and arquivo.filename:
        arquivo_nome = arquivo.filename
        content = arquivo.file.read()
        if content:
            registro = ArquivoImportado(
                nome=arquivo.filename,
                entidade='contratos',
                conteudo=content,
                tamanho=len(content),
            )
            db.add(registro)
            db.commit()
            db.refresh(registro)
            arquivo_upload_id = registro.id

    # Converter datas (strings ISO) para objetos datetime.date se necessário
    data_inicio_date = None
    data_fim_date = None
    try:
        if dataInicio:
            data_inicio_date = datetime.date.fromisoformat(dataInicio)
    except Exception:
        data_inicio_date = None
    try:
        if dataFim:
            data_fim_date = datetime.date.fromisoformat(dataFim)
    except Exception:
        data_fim_date = None

    db_contrato = Contrato(
        numero=numero,
        cliente=cliente,
        valor=valor,
        dataInicio=data_inicio_date,
        dataFim=data_fim_date,
        tipo=tipo,
        situacao=situacao,
        prazoPagamento=prazoPagamento,
        quantidadeParcelas=quantidadeParcelas,
        arquivo=arquivo_nome,
        arquivo_upload_id=arquivo_upload_id,
    )
    db.add(db_contrato)
    db.commit()
    db.refresh(db_contrato)
    return db_contrato

@app.get("/contratos/", response_model=List[ContratoSchema])
def list_contratos(db: Session = Depends(get_db)):
    return db.query(Contrato).all()


@app.put("/contratos/{contrato_id}", response_model=ContratoSchema)
def update_contrato(contrato_id: int, contrato_data: ContratoSchema, db: Session = Depends(get_db)):
    db_contrato = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not db_contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    # Atualizar campos
    update_data = contrato_data.dict(exclude_unset=True, exclude={'id'})
    
    # Converter datas se necessário
    if 'dataInicio' in update_data and update_data['dataInicio']:
        if isinstance(update_data['dataInicio'], str):
            try:
                update_data['dataInicio'] = datetime.date.fromisoformat(update_data['dataInicio'])
            except:
                update_data['dataInicio'] = None
    
    if 'dataFim' in update_data and update_data['dataFim']:
        if isinstance(update_data['dataFim'], str):
            try:
                update_data['dataFim'] = datetime.date.fromisoformat(update_data['dataFim'])
            except:
                update_data['dataFim'] = None
    
    for field, value in update_data.items():
        setattr(db_contrato, field, value)
    
    db.commit()
    db.refresh(db_contrato)
    return db_contrato


@app.get("/contratos/{contrato_id}/download")
def download_contrato_arquivo(contrato_id: int, db: Session = Depends(get_db)):
    contr = db.query(Contrato).filter(Contrato.id == contrato_id).first()
    if not contr:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    if not contr.arquivo_upload_id:
        raise HTTPException(status_code=404, detail="Contrato sem arquivo anexado")
    arq = db.query(ArquivoImportado).filter(ArquivoImportado.id == contr.arquivo_upload_id).first()
    if not arq:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return StreamingResponse(
        io.BytesIO(arq.conteudo),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={arq.nome}",
            "Content-Length": str(arq.tamanho or len(arq.conteudo) if arq.conteudo else 0),
        },
    )

# Valor Materiais
@app.post("/valor_materiais/", response_model=ValorMaterialSchema)
def create_valor_material(valor: ValorMaterialSchema, db: Session = Depends(get_db)):
    db_valor = ValorMaterial(**valor.dict())
    db.add(db_valor)
    db.commit()
    db.refresh(db_valor)
    return db_valor

@app.get("/valor_materiais/", response_model=List[ValorMaterialSchema])
def list_valor_materiais(db: Session = Depends(get_db)):
    return db.query(ValorMaterial).all()

# Resumo Mensal
@app.post("/resumo_mensal/", response_model=ResumoMensalSchema)
def create_resumo(resumo: ResumoMensalSchema, db: Session = Depends(get_db)):
    db_resumo = ResumoMensal(**resumo.dict())
    db.add(db_resumo)
    db.commit()
    db.refresh(db_resumo)
    return db_resumo

@app.get("/resumo_mensal/", response_model=List[ResumoMensalSchema])
def list_resumo_mensal(db: Session = Depends(get_db)):
    return db.query(ResumoMensal).all()

# ---------------- Arquivos Importados ----------------
@app.post("/uploads/{entidade}", response_model=ArquivoImportadoSchema)
def upload_arquivo(entidade: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Valida extensão permitida (Excel)
    allowed_ext = (".xlsx", ".xls")
    fname = file.filename or ""
    if not fname.lower().endswith(allowed_ext):
        raise HTTPException(status_code=400, detail="Arquivo deve ser Excel (.xlsx ou .xls)")

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio")
    # Limite de tamanho (25 MB)
    max_bytes = 25 * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="Arquivo muito grande (máximo 25 MB)")
    registro = ArquivoImportado(
        nome=file.filename,
        entidade=entidade,
        conteudo=content,
        tamanho=len(content),
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro

@app.get("/uploads", response_model=List[ArquivoImportadoSchema])
def listar_uploads(entidade: Optional[str] = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    q = db.query(ArquivoImportado)
    if entidade:
        q = q.filter(ArquivoImportado.entidade == entidade)
    return q.order_by(ArquivoImportado.id.desc()).offset(offset).limit(max(1, min(limit, 1000))).all()

@app.get("/uploads/{arquivo_id}/download")
def download_arquivo(arquivo_id: int, db: Session = Depends(get_db)):
    arq = db.query(ArquivoImportado).filter(ArquivoImportado.id == arquivo_id).first()
    if not arq:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return StreamingResponse(
        io.BytesIO(arq.conteudo),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={arq.nome}",
            "Content-Length": str(arq.tamanho or len(arq.conteudo) if arq.conteudo else 0),
        },
    )

@app.get("/uploads/{arquivo_id}/dados")
def dados_arquivo(arquivo_id: int, db: Session = Depends(get_db)):
    """Retorna o conteúdo do arquivo Excel importado como JSON (linhas e colunas)."""
    arq = db.query(ArquivoImportado).filter(ArquivoImportado.id == arquivo_id).first()
    if not arq:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    nome = (arq.nome or "").lower()
    content = io.BytesIO(arq.conteudo)
    try:
        if nome.endswith(".xlsx"):
            df = pd.read_excel(content, engine="openpyxl")
        elif nome.endswith(".xls"):
            df = pd.read_excel(content, engine="xlrd")
        else:
            # tentativa genérica
            df = pd.read_excel(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Falha ao ler Excel: {e}")
    # Normaliza NaN para strings vazias
    df = df.fillna("")
    colunas = [str(c) for c in df.columns.tolist()]

    def _to_jsonable(v):
        import datetime as _dt
        try:
            # pandas Timestamp -> datetime
            if hasattr(v, 'to_pydatetime'):
                v = v.to_pydatetime()
        except Exception:
            pass
        if isinstance(v, (_dt.datetime, _dt.date)):
            return v.isoformat()
        # valores já simples
        if isinstance(v, (str, int, float, bool)):
            return v
        # fallback para string
        return str(v) if v is not None else ""

    linhas = []
    for row in df.to_dict(orient="records"):
        linhas.append({str(k): _to_jsonable(v) for k, v in row.items()})

    return {"colunas": colunas, "linhas": linhas}

# --- Importação de planilhas Excel (opcional, não usada pelo frontend) ---
@app.post("/importar-excel/")
def importar_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Arquivo deve ser Excel (.xlsx ou .xls)")
    content = file.file.read()
    df = pd.read_excel(io.BytesIO(content))
    count = 0
    for _, row in df.iterrows():
        orc = OrcamentoObra(
            cliente_id=row.get("cliente_id", 1),
            etapa=row.get("Etapa", ""),
            descricao=row.get("Descrição", ""),
            unidade=row.get("Unidade", ""),
            quantidade=row.get("Quantidade", 0),
            custo_unitario=row.get("Custo Unitário (R$)", 0),
        )
        db.add(orc)
        count += 1
    db.commit()
    return {"importados": count}

# --------- Batch de dados por entidade (salvar/obter grade) ---------
@app.post("/tabelas/{entidade}", response_model=TabelaImportadaSchema)
def salvar_tabela(entidade: str, payload: TabelaImportadaSchema, db: Session = Depends(get_db)):
    # Cria nova versão (não remove anteriores)
    rec = TabelaImportada(
        entidade=entidade,
        dados_json=json.dumps(payload.dados or []),
        upload_id=payload.upload_id,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return TabelaImportadaSchema(
        id=rec.id,
        entidade=rec.entidade,
        dados=json.loads(rec.dados_json),
        upload_id=rec.upload_id,
        criado_em=rec.criado_em,
    )

@app.get("/tabelas/{entidade}", response_model=TabelaImportadaSchema | None)
def obter_tabela(entidade: str, db: Session = Depends(get_db)):
    rec = (
        db.query(TabelaImportada)
        .filter(TabelaImportada.entidade == entidade)
        .order_by(TabelaImportada.id.desc())
        .first()
    )
    if not rec:
        return None
    return TabelaImportadaSchema(
        id=rec.id,
        entidade=rec.entidade,
        dados=json.loads(rec.dados_json),
        upload_id=rec.upload_id,
        criado_em=rec.criado_em,
    )

@app.get("/tabelas/{entidade}/historico", response_model=List[TabelaImportadaSchema])
def historico_tabela(entidade: str, limit: int = 10, offset: int = 0, db: Session = Depends(get_db)):
    rows = (
        db.query(TabelaImportada)
        .filter(TabelaImportada.entidade == entidade)
        .order_by(TabelaImportada.id.desc())
        .offset(offset)
        .limit(max(1, min(limit, 50)))
        .all()
    )
    return [
        TabelaImportadaSchema(
            id=r.id,
            entidade=r.entidade,
            dados=json.loads(r.dados_json),
            upload_id=r.upload_id,
            criado_em=r.criado_em,
        )
        for r in rows
    ]

@app.get("/tabelas/{entidade}/{tabela_id}", response_model=TabelaImportadaSchema)
def obter_tabela_por_id(entidade: str, tabela_id: int, db: Session = Depends(get_db)):
    rec = (
        db.query(TabelaImportada)
        .filter(TabelaImportada.entidade == entidade, TabelaImportada.id == tabela_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Snapshot não encontrado")
    return TabelaImportadaSchema(
        id=rec.id,
        entidade=rec.entidade,
        dados=json.loads(rec.dados_json),
        upload_id=rec.upload_id,
        criado_em=rec.criado_em,
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# Healthcheck leve
@app.get("/health")
def health():
    return {"status": "ok"}

# Backup do sistema
@app.get("/backup/download")
def download_backup(db: Session = Depends(get_db)):
    """Gera um backup completo do sistema em formato ZIP"""
    import zipfile
    import tempfile
    import shutil
    from datetime import datetime
    
    # Criar arquivo temporário para o ZIP
    with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
        zip_path = tmp_file.name
    
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Adicionar banco de dados
            db_path = os.path.join(os.path.dirname(__file__), "gestao_obras.db")
            if os.path.exists(db_path):
                zipf.write(db_path, "gestao_obras.db")
            
            # Adicionar arquivos de configuração importantes
            config_files = ["models.py", "database.py", "main.py"]
            for config_file in config_files:
                file_path = os.path.join(os.path.dirname(__file__), config_file)
                if os.path.exists(file_path):
                    zipf.write(file_path, f"config/{config_file}")
        
        # Retornar arquivo ZIP
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_gestao_obras_{timestamp}.zip"
        
        def iterfile():
            with open(zip_path, mode="rb") as file_like:
                yield from file_like
                
        response = StreamingResponse(iterfile(), media_type="application/zip")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        
        # Agendar limpeza do arquivo temporário
        import threading
        def cleanup():
            import time
            time.sleep(10)  # Aguardar download terminar
            try:
                os.unlink(zip_path)
            except:
                pass
        threading.Thread(target=cleanup).start()
        
        return response
        
    except Exception as e:
        # Limpar em caso de erro
        try:
            os.unlink(zip_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Erro ao gerar backup: {str(e)}")

@app.post("/backup/create")
def create_backup_internal(db: Session = Depends(get_db)):
    """Cria um backup interno do sistema e salva na pasta uploads"""
    import zipfile
    import tempfile
    from datetime import datetime
    
    try:
        # Criar arquivo temporário para o ZIP
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
            zip_path = tmp_file.name
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Adicionar banco de dados
            db_path = os.path.join(os.path.dirname(__file__), "gestao_obras.db")
            if os.path.exists(db_path):
                zipf.write(db_path, "gestao_obras.db")
            
            # Adicionar arquivos de configuração
            config_files = ["models.py", "database.py", "main.py"]
            for config_file in config_files:
                file_path = os.path.join(os.path.dirname(__file__), config_file)
                if os.path.exists(file_path):
                    zipf.write(file_path, f"config/{config_file}")
        
        # Ler conteúdo do ZIP
        with open(zip_path, 'rb') as f:
            zip_content = f.read()
        
        # Salvar como ArquivoImportado
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_gestao_obras_{timestamp}.zip"
        
        backup_record = ArquivoImportado(
            nome=filename,
            entidade='backup',
            conteudo=zip_content,
            tamanho=len(zip_content),
        )
        db.add(backup_record)
        db.commit()
        db.refresh(backup_record)
        
        # Limpar arquivo temporário
        os.unlink(zip_path)
        
        return {
            "id": backup_record.id,
            "nome": backup_record.nome,
            "tamanho": backup_record.tamanho,
            "criado_em": backup_record.criado_em,
            "message": "Backup criado com sucesso"
        }
        
    except Exception as e:
        # Limpar em caso de erro
        try:
            os.unlink(zip_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {str(e)}")

@app.get("/backup/list")
def list_backups(db: Session = Depends(get_db)):
    """Lista todos os backups salvos no sistema"""
    backups = db.query(ArquivoImportado).filter(ArquivoImportado.entidade == 'backup').order_by(ArquivoImportado.criado_em.desc()).all()
    return [{
        "id": backup.id,
        "nome": backup.nome,
        "tamanho": backup.tamanho,
        "criado_em": backup.criado_em
    } for backup in backups]
