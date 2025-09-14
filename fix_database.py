import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import engine, SessionLocal
from backend.models import Base, Usuario
import hashlib
from datetime import datetime

def hash_password(password: str) -> str:
    """Hash password using SHA-256 to match backend"""
    return hashlib.sha256(password.encode()).hexdigest()

print("Iniciando migração da tabela usuarios...")

try:
    # Recrear todas as tabelas
    print("Recriando tabelas...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Tabelas recriadas com sucesso!")
    
    # Criar sessão
    db = SessionLocal()
    
    try:
        # Criar usuário admin
        admin_user = Usuario(
            username="admin",
            hashed_password=hash_password("admin"),
            nome="Administrador",
            email="admin@thors.com",
            nivel_acesso="Admin",
            ativo=True,
            criado_em=datetime.now(),
            atualizado_em=datetime.now()
        )
        
        # Criar usuário manutenção
        manutencao_user = Usuario(
            username="manutencao", 
            hashed_password=hash_password("123456"),
            nome="Usuário Manutenção",
            email="manutencao@thors.com",
            nivel_acesso="Manutenção",
            ativo=True,
            criado_em=datetime.now(),
            atualizado_em=datetime.now()
        )
        
        # Adicionar usuários
        db.add(admin_user)
        db.add(manutencao_user)
        db.commit()
        
        print("Usuários criados:")
        print("- admin / admin (Admin)")
        print("- manutencao / 123456 (Manutenção)")
        
        # Verificar se foram criados
        users = db.query(Usuario).all()
        print(f"\nTotal de usuários na tabela: {len(users)}")
        for user in users:
            print(f"  {user.username} - {user.nivel_acesso}")
            
        print("\n✅ Migração concluída com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuários: {e}")
        db.rollback()
    finally:
        db.close()
        
except Exception as e:
    print(f"❌ Erro durante migração: {e}")
    import traceback
    traceback.print_exc()
