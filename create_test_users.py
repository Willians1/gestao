#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import SessionLocal
from backend.models import Usuario

def create_test_users():
    db = SessionLocal()
    
    # Criar usuários de teste se não existirem
    usuarios_teste = [
        {'username': 'admin', 'nome': 'Administrador', 'email': 'admin@thors.com', 'nivel_acesso': 'admin', 'password': '123456'},
        {'username': 'willians', 'nome': 'Willians', 'email': 'willians@thors.com', 'nivel_acesso': 'willians', 'password': '123456'},
        {'username': 'manutencao', 'nome': 'Usuário Manutenção', 'email': 'manutencao@thors.com', 'nivel_acesso': 'manutencao', 'password': '123456'},
        {'username': 'usuario', 'nome': 'Usuário Visualização', 'email': 'usuario@thors.com', 'nivel_acesso': 'visualizacao', 'password': '123456'}
    ]
    
    for usuario_data in usuarios_teste:
        existing = db.query(Usuario).filter(Usuario.username == usuario_data['username']).first()
        if not existing:
            usuario = Usuario(
                username=usuario_data['username'],
                nome=usuario_data['nome'],
                email=usuario_data['email'],
                hashed_password=Usuario.hash_password(usuario_data['password']),
                nivel_acesso=usuario_data['nivel_acesso'],
                ativo=True
            )
            db.add(usuario)
            print(f'✅ Usuário {usuario_data["username"]} criado')
        else:
            print(f'ℹ️  Usuário {usuario_data["username"]} já existe')
    
    db.commit()
    db.close()
    print('\n🎉 Usuários de teste criados/verificados!')
    
    # Listar todos os usuários
    db = SessionLocal()
    usuarios = db.query(Usuario).all()
    print('\n📋 Usuários no sistema:')
    for user in usuarios:
        print(f'  - {user.username} ({user.nome}) - {user.nivel_acesso} - {"Ativo" if user.ativo else "Inativo"}')
    db.close()

if __name__ == '__main__':
    create_test_users()
