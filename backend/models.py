
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DECIMAL, Boolean, LargeBinary, DateTime, Text, Time
from datetime import datetime
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    email = Column(String, nullable=True)
    nivel_acesso = Column(String, nullable=False, default='visualizacao')  # admin, manutencao, visualizacao
    ativo = Column(Boolean, default=True)
    # Associação opcional a um grupo de usuários
    grupo_id = Column(Integer, ForeignKey("grupos_usuarios.id"), nullable=True)
    # permissoes = Column(Text, nullable=True)  # JSON string com permissões específicas
    # Colunas de auditoria removidas temporariamente para compatibilidade
    # criado_em = Column(DateTime, default=datetime.utcnow)
    # criado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    # atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # atualizado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    @staticmethod
    def hash_password(password: str) -> str:
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

    def verify_password(self, password: str) -> bool:
        import hashlib
        return self.hash_password(password) == self.hashed_password

class GrupoUsuario(Base):
    __tablename__ = "grupos_usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    descricao = Column(Text, nullable=True)
    status = Column(String, default='Aprovado')  # Aprovado, Pendente, Rejeitado
    motivo = Column(Text, nullable=True)
    valor_maximo_diario_financeiro = Column(DECIMAL(15,2), default=0.00)
    preco_venda = Column(DECIMAL(15,2), default=0.00)
    plano_contas = Column(DECIMAL(15,2), default=0.00)
    valor_maximo_movimentacao = Column(DECIMAL(15,2), default=0.00)
    valor_maximo_solicitacao_compra = Column(DECIMAL(15,2), default=0.00)
    valor_maximo_diario_solicitacao_compra = Column(DECIMAL(15,2), default=0.00)

class PermissaoSistema(Base):
    __tablename__ = "permissoes_sistema"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    descricao = Column(Text, nullable=True)
    categoria = Column(String, nullable=True)  # Sistema, Financeiro, Cadastros, etc.
    ativo = Column(Boolean, default=True)

class PermissaoGrupo(Base):
    __tablename__ = "permissoes_grupos"
    id = Column(Integer, primary_key=True, index=True)
    grupo_id = Column(Integer, ForeignKey("grupos_usuarios.id"), nullable=False)
    permissao_id = Column(Integer, ForeignKey("permissoes_sistema.id"), nullable=False)
    ativo = Column(Boolean, default=True)

class Loja(Base):
    __tablename__ = "lojas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    codigo = Column(String, unique=True, nullable=True)
    endereco = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)

class LojaGrupo(Base):
    __tablename__ = "lojas_grupos"
    id = Column(Integer, primary_key=True, index=True)
    grupo_id = Column(Integer, ForeignKey("grupos_usuarios.id"), nullable=False)
    loja_id = Column(Integer, ForeignKey("lojas.id"), nullable=False)
    acesso_total = Column(Boolean, default=False)  # Se True, tem acesso a todas as lojas

class ClienteGrupo(Base):
    __tablename__ = "clientes_grupos"
    id = Column(Integer, primary_key=True, index=True)
    grupo_id = Column(Integer, ForeignKey("grupos_usuarios.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    cnpj = Column(String, unique=True, nullable=True)
    email = Column(String, nullable=True)
    contato = Column(String, nullable=True)
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
    id_cliente = Column(Integer, ForeignKey("clientes.id"))  # Atualizado para corresponder ao frontend
    cliente_id = Column(Integer, ForeignKey("clientes.id"))  # Mantido para compatibilidade
    servico = Column(String, nullable=False)  # Novo campo - antes era 'descricao'
    descricao = Column(String, nullable=True)  # Mantido para compatibilidade
    valor = Column(DECIMAL(10,2), nullable=False)
    data = Column(Date, nullable=True)
    categoria = Column(String, nullable=True)  # Novo campo
    status = Column(String, nullable=True, default='Pendente')  # Novo campo
    observacoes = Column(Text, nullable=True)  # Novo campo

class Contrato(Base):
    __tablename__ = "contratos"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    cliente = Column(String, nullable=True)  # Manter por compatibilidade, mas usar cliente_id
    valor = Column(DECIMAL(10,2), nullable=False)
    dataInicio = Column(Date, nullable=True)
    dataFim = Column(Date, nullable=True)
    tipo = Column(String, nullable=True)
    situacao = Column(String, nullable=True)
    prazoPagamento = Column(String, nullable=True)
    quantidadeParcelas = Column(String, nullable=True)
    arquivo = Column(String, nullable=True)  # Nome do arquivo anexado (compatibilidade)
    arquivo_upload_id = Column(Integer, ForeignKey("arquivos_importados.id"), nullable=True)
    
    # Relacionamento com cliente
    cliente_obj = relationship("Cliente")

class ValorMaterial(Base):
    __tablename__ = "valor_materiais"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)  # Cliente específico (opcional)
    descricao_produto = Column(String, nullable=False)
    marca = Column(String, nullable=True, default="")
    unidade_medida = Column(String, nullable=True, default="")
    valor_unitario = Column(DECIMAL(10,2), nullable=False)
    estoque_atual = Column(Integer, nullable=True, default=0)
    estoque_minimo = Column(Integer, nullable=True, default=0)
    data_ultima_entrada = Column(String, nullable=True, default="")
    responsavel = Column(String, nullable=True, default="")
    fornecedor = Column(String, nullable=True, default="")
    valor = Column(DECIMAL(10,2), nullable=True)
    localizacao = Column(String, nullable=True, default="")
    observacoes = Column(String, nullable=True, default="")

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

class TesteLoja(Base):
    __tablename__ = "testes_loja"
    id = Column(Integer, primary_key=True, index=True)
    data_teste = Column(Date, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    horario = Column(Time, nullable=False)
    foto = Column(String, nullable=True)  # Nome do arquivo da foto
    video = Column(String, nullable=True)  # Nome do arquivo do vídeo (até 10MB)
    status = Column(String, nullable=False)  # 'OK' ou 'OFF'
    observacao = Column(String, nullable=True)  # Até 150 caracteres, opcional para 'OK', obrigatório para 'OFF'
    # Colunas de auditoria removidas temporariamente para compatibilidade
    # criado_em = Column(DateTime, default=datetime.utcnow)
    # criado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    # atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # atualizado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Relacionamento com cliente
    cliente = relationship("Cliente")

class TesteArCondicionado(Base):
    __tablename__ = "testes_ar_condicionado"
    id = Column(Integer, primary_key=True, index=True)
    data_teste = Column(Date, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    horario = Column(Time, nullable=False)
    foto = Column(String, nullable=True)  # Nome do arquivo da foto
    video = Column(String, nullable=True)  # Nome do arquivo do vídeo (até 10MB)
    status = Column(String, nullable=False)  # 'OK' ou 'OFF'
    observacao = Column(String, nullable=True)  # Até 150 caracteres, opcional para 'OK', obrigatório para 'OFF'
    # Colunas de auditoria removidas temporariamente para compatibilidade
    # criado_em = Column(DateTime, default=datetime.utcnow)
    # criado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    # atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # atualizado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Relacionamento com cliente
    cliente = relationship("Cliente")

class AuditoriaOcorrencia(Base):
    __tablename__ = "auditoria_ocorrencias"
    id = Column(Integer, primary_key=True, index=True)
    tabela = Column(String, nullable=False)  # Nome da tabela modificada
    registro_id = Column(Integer, nullable=False)  # ID do registro modificado
    acao = Column(String, nullable=False)  # 'CREATE', 'UPDATE', 'DELETE'
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    usuario_nome = Column(String, nullable=False)  # Nome do usuário para histórico
    data_hora = Column(DateTime, default=datetime.utcnow)
    valores_anteriores = Column(Text, nullable=True)  # JSON com valores antes da alteração
    valores_novos = Column(Text, nullable=True)  # JSON com valores após a alteração
    observacao = Column(String, nullable=True)  # Observação adicional
    
    # Relacionamento com usuário
    usuario = relationship("Usuario", foreign_keys=[usuario_id])

class RelatorioObras(Base):
    __tablename__ = "relatorios_obras"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    data_relatorio = Column(DateTime, default=datetime.utcnow, nullable=False)
    tempo = Column(String, nullable=True)  # 'manha', 'tarde', 'noite'
    condicao = Column(String, nullable=True)  # 'manha', 'tarde', 'noite' (condição climática)
    indice_pluviometrico = Column(Float, nullable=True)  # Quantidade em mm
    mao_de_obra = Column(Text, nullable=True)  # JSON string array
    equipamentos = Column(Text, nullable=True)  # JSON string array
    atividades = Column(Text, nullable=True)  # JSON string array
    criado_em = Column(DateTime, default=datetime.utcnow)
    criado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Relacionamento com cliente
    cliente = relationship("Cliente")
