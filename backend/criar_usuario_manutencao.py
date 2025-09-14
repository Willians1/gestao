#!/usr/bin/env python3
"""
Script para criar usuário de manutenção
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models import Usuario

def criar_usuario_manutencao():
    # Obter sessão do banco
    db = next(get_db())
    
    try:
        # Verificar usuários existentes
        usuarios = db.query(Usuario).all()
        print('Usuários existentes:')
        for user in usuarios:
            print(f'  - {user.username}: {user.nivel_acesso}')
        
        # Verificar se existe usuário de manutenção
        manutencao_user = db.query(Usuario).filter(Usuario.nivel_acesso == 'Manutenção').first()
        
        if not manutencao_user:
            print('\nCriando usuário de manutenção...')
            novo_usuario = Usuario(
                username='manutencao',
                hashed_password=Usuario.hash_password('123456'),
                nome='Usuário Manutenção',
                email='manutencao@thors.com',
                nivel_acesso='Manutenção',
                ativo=True
            )
            db.add(novo_usuario)
            db.commit()
            print('✅ Usuário de manutenção criado com sucesso!')
            print('   Username: manutencao')
            print('   Password: 123456')
        else:
            print(f'\n✅ Usuário de manutenção já existe: {manutencao_user.username}')
    
    except Exception as e:
        print(f'❌ Erro: {e}')
    finally:
        db.close()

if __name__ == '__main__':
    criar_usuario_manutencao()
