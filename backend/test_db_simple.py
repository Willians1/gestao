import sys
import os
sys.path.append(os.path.dirname(__file__))

from database import SessionLocal
from models import PermissaoSistema, Loja, GrupoUsuario

def test_db():
    db = SessionLocal()
    try:
        # Criar uma permissão de teste
        perm = PermissaoSistema(nome="Teste", categoria="Sistema")
        db.add(perm)
        db.commit()
        
        # Verificar se foi criada
        count = db.query(PermissaoSistema).count()
        print(f"Permissões no banco: {count}")
        
        return True
    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_db()
    print(f"Teste {'passou' if success else 'falhou'}")
