
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DECIMAL, Boolean, LargeBinary, DateTime, Text
from datetime import datetime
from sqlalchemy.orm import declarative_base, relationship
from passlib.hash import bcrypt

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hash(password)

    def verify_password(self, password: str) -> bool:
        return bcrypt.verify(password, self.hashed_password)

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    cnpj = Column(String, unique=True, nullable=True)
    endereco = Column(String, nullable=True)
    # Relacionamento com obras, contratos, etc.
    orcamentos = relationship("OrcamentoObra", back_populates="cliente")

class Fornecedor(Base):
    __tablename__ = "fornecedores"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cnpj = Column(String, nullable=True)
    contato = Column(String, nullable=True)

class OrcamentoObra(Base):
    __tablename__ = "orcamento_obra"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    etapa = Column(String, nullable=False)
    descricao = Column(String, nullable=False)
    unidade = Column(String, nullable=False)
    quantidade = Column(Float, nullable=False)
    custo_unitario = Column(DECIMAL(10,2), nullable=False)
    data = Column(Date, nullable=True)
    cliente = relationship("Cliente", back_populates="orcamentos")

class Despesa(Base):
    __tablename__ = "despesas"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    descricao = Column(String, nullable=False)
    valor = Column(DECIMAL(10,2), nullable=False)
    data = Column(Date, nullable=True)

class Contrato(Base):
    __tablename__ = "contratos"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String, nullable=False)
    cliente = Column(String, nullable=False)
    valor = Column(DECIMAL(10,2), nullable=False)
    dataInicio = Column(Date, nullable=True)
    dataFim = Column(Date, nullable=True)
    tipo = Column(String, nullable=True)
    situacao = Column(String, nullable=True)
    prazoPagamento = Column(String, nullable=True)
    quantidadeParcelas = Column(String, nullable=True)
    arquivo = Column(String, nullable=True)  # Nome do arquivo anexado (compatibilidade)
    arquivo_upload_id = Column(Integer, ForeignKey("arquivos_importados.id"), nullable=True)

class ValorMaterial(Base):
    __tablename__ = "valor_materiais"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    unidade = Column(String, nullable=False)
    valor = Column(DECIMAL(10,2), nullable=False)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"))

class ResumoMensal(Base):
    __tablename__ = "resumo_mensal"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    mes = Column(String, nullable=False)
    ano = Column(Integer, nullable=False)
    total_despesas = Column(DECIMAL(10,2), nullable=False)
    total_orcamento = Column(DECIMAL(10,2), nullable=False)

class ArquivoImportado(Base):
    __tablename__ = "arquivos_importados"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    entidade = Column(String, nullable=False)
    conteudo = Column(LargeBinary, nullable=False)
    tamanho = Column(Integer, nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow)

class TabelaImportada(Base):
    __tablename__ = "tabelas_importadas"
    id = Column(Integer, primary_key=True, index=True)
    entidade = Column(String, nullable=False, index=True)
    dados_json = Column(Text, nullable=False)  # JSON como texto
    upload_id = Column(Integer, ForeignKey("arquivos_importados.id"), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
