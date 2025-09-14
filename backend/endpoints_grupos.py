# Adicionando endpoints para grupos ao final do arquivo main.py

# === GRUPOS DE USUÁRIOS ===

@app.get("/grupos/", response_model=List[GrupoUsuarioSchema])
def listar_grupos(db: Session = Depends(get_db)):
    return db.query(GrupoUsuario).all()

@app.post("/grupos/", response_model=GrupoUsuarioSchema)
def criar_grupo(grupo: GrupoUsuarioCreateSchema, db: Session = Depends(get_db)):
    if db.query(GrupoUsuario).filter(GrupoUsuario.nome == grupo.nome).first():
        raise HTTPException(status_code=400, detail="Grupo já existe")
    
    novo_grupo = GrupoUsuario(
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
    db.add(novo_grupo)
    db.commit()
    db.refresh(novo_grupo)
    return novo_grupo

# === PERMISSÕES DO SISTEMA ===

@app.get("/permissoes/", response_model=List[PermissaoSistemaSchema])
def listar_permissoes(db: Session = Depends(get_db)):
    return db.query(PermissaoSistema).all()

# === LOJAS ===

@app.get("/lojas/", response_model=List[LojaSchema])
def listar_lojas(db: Session = Depends(get_db)):
    return db.query(Loja).all()

@app.post("/lojas/", response_model=LojaSchema)
def criar_loja(loja: LojaSchema, db: Session = Depends(get_db)):
    nova_loja = Loja(
        nome=loja.nome,
        codigo=loja.codigo,
        endereco=loja.endereco,
        ativo=loja.ativo
    )
    db.add(nova_loja)
    db.commit()
    db.refresh(nova_loja)
    return nova_loja
