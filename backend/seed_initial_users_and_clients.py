"""
Seed inicial para ambiente de desenvolvimento:
- Garante pelo menos 16 clientes (Cliente 01..Cliente 16) usando o mesmo DB da API (SessionLocal)
- Garante o usuário "willians" (senha: willians, nível: Willians)
- Executa o seed de manutenção de lojas (loja01..loja16) com grupos e vínculo ao cliente correspondente

Uso:
  python backend/seed_initial_users_and_clients.py
"""
from database import SessionLocal
from models import Cliente, Usuario
from seed_manutencao_lojas import run as seed_lojas


def ensure_clients(n: int = 16):
    """Cria clientes de exemplo até atingir n clientes no total."""
    db = SessionLocal()
    try:
        count = db.query(Cliente).count()
        to_create = max(0, n - count)
        if to_create <= 0:
            print(f"Clientes suficientes já existem: {count}")
            return
        start_idx = count + 1
        for i in range(start_idx, start_idx + to_create):
            nome = f"Cliente {i:02d}"
            c = Cliente(nome=nome)
            db.add(c)
        db.commit()
        print(f"Criados {to_create} clientes de exemplo (agora total={n}).")
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar clientes: {e}")
        raise
    finally:
        db.close()


def ensure_willians_user():
    """Garante usuário 'willians' com senha 'willians' e nível 'Willians'."""
    import hashlib
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.username == "willians").first()
        desired_hash = hashlib.sha256("willians".encode()).hexdigest()
        if not user:
            user = Usuario(
                username="willians",
                hashed_password=desired_hash,
                nome="Willians",
                email="willians@thors.com",
                nivel_acesso="Willians",
                ativo=True,
            )
            db.add(user)
            db.commit()
            print("Criado usuário 'willians'.")
        else:
            changed = False
            if not user.ativo:
                user.ativo = True; changed = True
            if (user.nivel_acesso or "").lower() != "willians":
                user.nivel_acesso = "Willians"; changed = True
            if user.hashed_password != desired_hash:
                user.hashed_password = desired_hash; changed = True
            if changed:
                db.add(user)
                db.commit()
                print("Atualizado usuário 'willians'.")
            else:
                print("Usuário 'willians' já ok.")
    except Exception as e:
        db.rollback()
        print(f"Erro ao garantir usuário willians: {e}")
        raise
    finally:
        db.close()


def main():
    ensure_clients(16)
    ensure_willians_user()
    print("Rodando seed de lojas (loja01..loja16)...")
    seed_lojas()


if __name__ == "__main__":
    main()
