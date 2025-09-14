#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import SessionLocal
from backend.models import PermissaoSistema, Loja, GrupoUsuario

def criar_permissoes_sistema():
    db = SessionLocal()
    
    # Lista de permissões baseada na segunda imagem
    permissoes = [
        {"nome": "Acelerato", "categoria": "Sistema", "descricao": "Acesso ao módulo Acelerato"},
        {"nome": "Acesso via Internet", "categoria": "Sistema", "descricao": "Acesso remoto via internet"},
        {"nome": "Acordo Comercial", "categoria": "Financeiro", "descricao": "Gestão de acordos comerciais"},
        {"nome": "Acordo Comercial Produto", "categoria": "Financeiro", "descricao": "Acordos comerciais por produto"},
        {"nome": "Acordo Promocional", "categoria": "Financeiro", "descricao": "Gestão de acordos promocionais"},
        {"nome": "Administração de Preços", "categoria": "Financeiro", "descricao": "Administração de preços"},
        {"nome": "Administração do Sistema", "categoria": "Sistema", "descricao": "Administração completa do sistema"},
        {"nome": "Agenda de Compromissos", "categoria": "Gestão", "descricao": "Agenda de compromissos"},
        {"nome": "Ajustes de Estoque", "categoria": "Estoque", "descricao": "Ajustes de estoque"},
        {"nome": "Aprovar Promoção/Ofertas", "categoria": "Financeiro", "descricao": "Aprovação de promoções e ofertas"},
        {"nome": "Armazenagem em Terceiros", "categoria": "Estoque", "descricao": "Gestão de armazenagem terceirizada"},
        {"nome": "Associados", "categoria": "Cadastros", "descricao": "Gestão de associados"},
        {"nome": "BI", "categoria": "Relatórios", "descricao": "Business Intelligence"},
        {"nome": "Baixa de Serviços", "categoria": "Serviços", "descricao": "Baixa de serviços"},
        {"nome": "Bancos", "categoria": "Financeiro", "descricao": "Gestão bancária"},
        {"nome": "Cadastro de Operador", "categoria": "Cadastros", "descricao": "Cadastro de operadores"},
        {"nome": "Cadastro de Sazonalidades", "categoria": "Cadastros", "descricao": "Cadastro de sazonalidades"},
        {"nome": "Cadastro de Tipo de Pesquisa", "categoria": "Cadastros", "descricao": "Tipos de pesquisa"},
        {"nome": "Cadastros", "categoria": "Cadastros", "descricao": "Acesso aos cadastros gerais"},
        {"nome": "Clientes", "categoria": "Cadastros", "descricao": "Gestão de clientes"},
        {"nome": "Contratos", "categoria": "Gestão", "descricao": "Gestão de contratos"},
        {"nome": "Despesas", "categoria": "Financeiro", "descricao": "Gestão de despesas"},
        {"nome": "Fornecedores", "categoria": "Cadastros", "descricao": "Gestão de fornecedores"},
        {"nome": "Orçamento de Obra", "categoria": "Gestão", "descricao": "Orçamentos de obras"},
        {"nome": "Resumo Mensal", "categoria": "Relatórios", "descricao": "Relatórios mensais"},
        {"nome": "Valor de Materiais", "categoria": "Financeiro", "descricao": "Gestão de valores de materiais"},
        {"nome": "Testes de Loja", "categoria": "Testes", "descricao": "Testes específicos de loja"},
        {"nome": "Testes de Ar Condicionado", "categoria": "Testes", "descricao": "Testes de ar condicionado"}
    ]
    
    for perm_data in permissoes:
        existing = db.query(PermissaoSistema).filter(PermissaoSistema.nome == perm_data['nome']).first()
        if not existing:
            permissao = PermissaoSistema(
                nome=perm_data['nome'],
                descricao=perm_data['descricao'],
                categoria=perm_data['categoria'],
                ativo=True
            )
            db.add(permissao)
            print(f'✅ Permissão criada: {perm_data["nome"]}')
        else:
            print(f'ℹ️  Permissão já existe: {perm_data["nome"]}')
    
    db.commit()
    print(f'\n🎉 {len(permissoes)} permissões processadas!')

def criar_lojas_exemplo():
    db = SessionLocal()
    
    # Lojas de exemplo
    lojas = [
        {"nome": "Loja Centro", "codigo": "LJ001", "endereco": "Rua Principal, 123 - Centro"},
        {"nome": "Loja Shopping Norte", "codigo": "LJ002", "endereco": "Shopping Norte - Av. Norte, 456"},
        {"nome": "Loja Sul", "codigo": "LJ003", "endereco": "Rua Sul, 789 - Bairro Sul"},
        {"nome": "Loja Online", "codigo": "LJ004", "endereco": "Plataforma Digital"},
        {"nome": "Loja Oeste", "codigo": "LJ005", "endereco": "Av. Oeste, 321 - Zona Oeste"}
    ]
    
    for loja_data in lojas:
        existing = db.query(Loja).filter(Loja.codigo == loja_data['codigo']).first()
        if not existing:
            loja = Loja(
                nome=loja_data['nome'],
                codigo=loja_data['codigo'],
                endereco=loja_data['endereco'],
                ativo=True
            )
            db.add(loja)
            print(f'✅ Loja criada: {loja_data["nome"]} ({loja_data["codigo"]})')
        else:
            print(f'ℹ️  Loja já existe: {loja_data["nome"]}')
    
    db.commit()
    print(f'\n🏪 {len(lojas)} lojas processadas!')

def criar_grupo_administrador():
    db = SessionLocal()
    
    existing = db.query(GrupoUsuario).filter(GrupoUsuario.nome == "ADMINISTRADOR DE SISTEMA").first()
    if not existing:
        grupo = GrupoUsuario(
            nome="ADMINISTRADOR DE SISTEMA",
            descricao="Grupo com acesso total ao sistema",
            status="Aprovado",
            valor_maximo_diario_financeiro=99999999.00,
            preco_venda=0.00,
            plano_contas=0.00,
            valor_maximo_movimentacao=0.00,
            valor_maximo_solicitacao_compra=0.00,
            valor_maximo_diario_solicitacao_compra=0.00
        )
        db.add(grupo)
        db.commit()
        print(f'✅ Grupo "ADMINISTRADOR DE SISTEMA" criado!')
    else:
        print(f'ℹ️  Grupo "ADMINISTRADOR DE SISTEMA" já existe')
    
    db.close()

if __name__ == '__main__':
    print("🚀 Iniciando criação de dados base...")
    criar_permissoes_sistema()
    criar_lojas_exemplo()
    criar_grupo_administrador()
    print("\n✨ Setup completo!")
