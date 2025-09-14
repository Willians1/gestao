#!/usr/bin/env python3
"""
Script para popular o banco com dados de exemplo para testes
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from database import SessionLocal
from models import PermissaoSistema, Loja, GrupoUsuario, PermissaoGrupo, LojaGrupo

def create_sample_data():
    db = SessionLocal()
    
    try:
        # Limpar dados existentes
        db.query(LojaGrupo).delete()
        db.query(PermissaoGrupo).delete() 
        db.query(GrupoUsuario).delete()
        db.query(PermissaoSistema).delete()
        db.query(Loja).delete()
        
        # Criar permissões com IDs numéricos de 4 dígitos
        permissoes = [
            # Sistema (1000-1099)
            {'id': 1001, 'nome': 'Dashboard', 'categoria': 'Sistema'},
            {'id': 1002, 'nome': 'Relatórios', 'categoria': 'Sistema'},
            {'id': 1003, 'nome': 'Análises', 'categoria': 'Sistema'},
            {'id': 1004, 'nome': 'Administração do Sistema', 'categoria': 'Sistema'},
            {'id': 1005, 'nome': 'Backup', 'categoria': 'Sistema'},
            
            # Cadastros - Usuários (1100-1199)
            {'id': 1101, 'nome': 'Usuários', 'categoria': 'Cadastros'},
            {'id': 1102, 'nome': 'Usuários - Alterar', 'categoria': 'Cadastros'},
            {'id': 1103, 'nome': 'Usuários - Excluir', 'categoria': 'Cadastros'},
            {'id': 1104, 'nome': 'Usuários - Criar', 'categoria': 'Cadastros'},
            
            # Cadastros - Clientes (1200-1299)
            {'id': 1201, 'nome': 'Clientes', 'categoria': 'Cadastros'},
            {'id': 1202, 'nome': 'Clientes - Alterar', 'categoria': 'Cadastros'},
            {'id': 1203, 'nome': 'Clientes - Excluir', 'categoria': 'Cadastros'},
            {'id': 1204, 'nome': 'Clientes - Criar/Importar', 'categoria': 'Cadastros'},
            
            # Cadastros - Fornecedores (1300-1399)
            {'id': 1301, 'nome': 'Fornecedores', 'categoria': 'Cadastros'},
            {'id': 1302, 'nome': 'Fornecedores - Alterar', 'categoria': 'Cadastros'},
            {'id': 1303, 'nome': 'Fornecedores - Excluir', 'categoria': 'Cadastros'},
            {'id': 1304, 'nome': 'Fornecedores - Criar/Importar', 'categoria': 'Cadastros'},
            
            # Obras - Contratos (1400-1499)
            {'id': 1401, 'nome': 'Contratos', 'categoria': 'Obras'},
            {'id': 1402, 'nome': 'Contratos - Alterar', 'categoria': 'Obras'},
            {'id': 1403, 'nome': 'Contratos - Excluir', 'categoria': 'Obras'},
            {'id': 1404, 'nome': 'Contratos - Criar/Importar', 'categoria': 'Obras'},
            
            # Obras - Orçamento (1500-1599)
            {'id': 1501, 'nome': 'Orçamento de Obra', 'categoria': 'Obras'},
            {'id': 1502, 'nome': 'Orçamento - Alterar', 'categoria': 'Obras'},
            {'id': 1503, 'nome': 'Orçamento - Excluir', 'categoria': 'Obras'},
            {'id': 1504, 'nome': 'Orçamento - Criar/Importar', 'categoria': 'Obras'},
            
            # Financeiro - Despesas (1600-1699)
            {'id': 1601, 'nome': 'Despesas', 'categoria': 'Financeiro'},
            {'id': 1602, 'nome': 'Despesas - Alterar', 'categoria': 'Financeiro'},
            {'id': 1603, 'nome': 'Despesas - Excluir', 'categoria': 'Financeiro'},
            {'id': 1604, 'nome': 'Despesas - Criar/Importar', 'categoria': 'Financeiro'},
            
            # Materiais (1700-1799)
            {'id': 1701, 'nome': 'Valor Materiais', 'categoria': 'Materiais'},
            {'id': 1702, 'nome': 'Valor Materiais - Alterar', 'categoria': 'Materiais'},
            {'id': 1703, 'nome': 'Valor Materiais - Excluir', 'categoria': 'Materiais'},
            {'id': 1704, 'nome': 'Valor Materiais - Criar/Importar', 'categoria': 'Materiais'},
            
            # Relatórios (1800-1899)
            {'id': 1801, 'nome': 'Resumo Mensal', 'categoria': 'Relatórios'},
            {'id': 1802, 'nome': 'Resumo Mensal - Alterar', 'categoria': 'Relatórios'},
            {'id': 1803, 'nome': 'Resumo Mensal - Excluir', 'categoria': 'Relatórios'},
            {'id': 1804, 'nome': 'Resumo Mensal - Criar/Importar', 'categoria': 'Relatórios'},
            
            # Lojas (1900-1999)
            {'id': 1901, 'nome': 'Acesso a Todas as Lojas', 'categoria': 'Lojas'},
            {'id': 1902, 'nome': 'Acesso a Loja Individual', 'categoria': 'Lojas'},
            {'id': 1903, 'nome': 'Gerenciar Lojas', 'categoria': 'Lojas'},
        ]
        
        for perm_data in permissoes:
            perm = PermissaoSistema(**perm_data)
            db.add(perm)
        
        # Criar lojas de exemplo
        lojas_data = [
            {'nome': 'Loja Centro', 'endereco': 'Rua Principal, 123'},
            {'nome': 'Loja Norte', 'endereco': 'Av. Norte, 456'},
            {'nome': 'Loja Sul', 'endereco': 'Rua Sul, 789'},
            {'nome': 'Loja Shopping', 'endereco': 'Shopping Center, Loja 45'},
            {'nome': 'Matriz', 'endereco': 'Av. Principal, 1000'},
        ]
        
        for loja_data in lojas_data:
            loja = Loja(**loja_data)
            db.add(loja)
        
        # Criar grupos de exemplo
        grupos_data = [
            {
                'nome': 'Administradores',
                'status': 'Aprovado',
                'motivo': 'Acesso total ao sistema',
                'valor_maximo_diario_financeiro': 99999999.00,
                'preco_venda': 0.00,
                'plano_contas': 0.00,
                'valor_maximo_movimentacao': 99999999.00,
                'valor_maximo_solicitacao_compra': 99999999.00,
                'valor_maximo_diario_solicitacao_compra': 99999999.00
            },
            {
                'nome': 'Gerentes',
                'status': 'Aprovado', 
                'motivo': 'Gestão de loja',
                'valor_maximo_diario_financeiro': 50000.00,
                'preco_venda': 0.00,
                'plano_contas': 0.00,
                'valor_maximo_movimentacao': 25000.00,
                'valor_maximo_solicitacao_compra': 15000.00,
                'valor_maximo_diario_solicitacao_compra': 10000.00
            },
            {
                'nome': 'Vendedores',
                'status': 'Aprovado',
                'motivo': 'Operações de venda',
                'valor_maximo_diario_financeiro': 5000.00,
                'preco_venda': 0.00,
                'plano_contas': 0.00,
                'valor_maximo_movimentacao': 2000.00,
                'valor_maximo_solicitacao_compra': 1000.00,
                'valor_maximo_diario_solicitacao_compra': 500.00
            },
            {
                'nome': 'Financeiro',
                'status': 'Aprovado',
                'motivo': 'Gestão financeira',
                'valor_maximo_diario_financeiro': 100000.00,
                'preco_venda': 0.00,
                'plano_contas': 0.00,
                'valor_maximo_movimentacao': 75000.00,
                'valor_maximo_solicitacao_compra': 5000.00,
                'valor_maximo_diario_solicitacao_compra': 2000.00
            }
        ]
        
        for grupo_data in grupos_data:
            grupo = GrupoUsuario(**grupo_data)
            db.add(grupo)
        
        db.commit()
        print("✅ Dados de exemplo criados com sucesso!")
        
        # Exibir estatísticas
        print(f"📊 Permissões criadas: {db.query(PermissaoSistema).count()}")
        print(f"🏪 Lojas criadas: {db.query(Loja).count()}")
        print(f"👥 Grupos criados: {db.query(GrupoUsuario).count()}")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()
