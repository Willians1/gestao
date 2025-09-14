#!/usr/bin/env python3
"""
Script para criar dados de teste para a funcionalidade de Testes de Loja
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import Cliente, TesteLoja
from datetime import date, time, datetime
import random

def criar_dados_teste():
    """Cria dados de teste para clientes e testes de loja"""
    db = SessionLocal()
    
    try:
        # Verificar se já existem clientes
        clientes_existentes = db.query(Cliente).count()
        
        if clientes_existentes == 0:
            # Criar alguns clientes de teste
            clientes_teste = [
                Cliente(nome="Empresa ABC Ltda", cnpj="12.345.678/0001-90", email="contato@empresaabc.com", contato="(11) 99999-1234", endereco="Rua das Flores, 123"),
                Cliente(nome="Comércio XYZ", cnpj="98.765.432/0001-10", email="vendas@comercioxyz.com", contato="(11) 88888-5678", endereco="Av. Principal, 456"),
                Cliente(nome="Indústria 123", cnpj="11.222.333/0001-44", email="admin@industria123.com", contato="(11) 77777-9012", endereco="Rua Industrial, 789"),
                Cliente(nome="Loja Central", cnpj="55.666.777/0001-88", email="gerencia@lojacentral.com", contato="(11) 66666-3456", endereco="Centro Comercial, Loja 10"),
                Cliente(nome="Distribuidora Norte", cnpj="33.444.555/0001-22", email="vendas@distnorte.com", contato="(11) 55555-7890", endereco="Zona Norte, 100")
            ]
            
            for cliente in clientes_teste:
                db.add(cliente)
            
            db.commit()
            print(f"✓ {len(clientes_teste)} clientes de teste criados!")
        else:
            print(f"✓ {clientes_existentes} clientes já existem no banco.")
        
        # Criar alguns testes de loja de exemplo
        clientes = db.query(Cliente).all()
        
        # Verificar se já existem testes
        testes_existentes = db.query(TesteLoja).count()
        
        if testes_existentes == 0 and clientes:
            testes_exemplo = [
                TesteLoja(
                    data_teste=date(2025, 9, 1),
                    cliente_id=clientes[0].id,
                    horario=time(9, 30),
                    status='OK',
                    observacao=None
                ),
                TesteLoja(
                    data_teste=date(2025, 9, 2),
                    cliente_id=clientes[1].id,
                    horario=time(14, 15),
                    status='OFF',
                    observacao='Gerador apresentou falha no motor de partida'
                ),
                TesteLoja(
                    data_teste=date(2025, 9, 3),
                    cliente_id=clientes[2].id,
                    horario=time(10, 0),
                    status='OK',
                    observacao=None
                ),
                TesteLoja(
                    data_teste=date(2025, 9, 4),
                    cliente_id=clientes[0].id,
                    horario=time(16, 45),
                    status='OFF',
                    observacao='Necessária manutenção preventiva - filtro de óleo sujo'
                )
            ]
            
            for teste in testes_exemplo:
                db.add(teste)
            
            db.commit()
            print(f"✓ {len(testes_exemplo)} testes de exemplo criados!")
        else:
            print(f"✓ {testes_existentes} testes já existem no banco.")
            
    except Exception as e:
        print(f"❌ Erro ao criar dados de teste: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Criando dados de teste...")
    criar_dados_teste()
    print("\n🎉 Dados de teste criados com sucesso!")
