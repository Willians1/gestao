#!/usr/bin/env python3
"""
Script para criar a tabela testes_loja no banco de dados
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from backend.models import Base, TesteLoja

def create_testes_loja_table():
    """Cria a tabela testes_loja"""
    try:
        # Criar apenas a tabela TesteLoja
        TesteLoja.__table__.create(engine, checkfirst=True)
        print("✓ Tabela 'testes_loja' criada com sucesso!")
        
        # Criar diretório para uploads de fotos se não existir
        upload_dir = "uploads/testes-loja"
        os.makedirs(upload_dir, exist_ok=True)
        print(f"✓ Diretório '{upload_dir}' criado com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao criar tabela: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Criando tabela testes_loja...")
    success = create_testes_loja_table()
    
    if success:
        print("\n🎉 Migração concluída com sucesso!")
    else:
        print("\n❌ Migração falhou!")
        sys.exit(1)
