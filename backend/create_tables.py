from database import engine, SessionLocal
from models import Base, Usuario

# Cria as tabelas no banco de dados SQLite e usuários padrão
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Usuário admin
    if not db.query(Usuario).filter_by(username="admin").first():
        admin = Usuario(
            username="admin",
            hashed_password=Usuario.hash_password("admin"),
            is_admin=True
        )
        db.add(admin)
        print("Usuário admin criado com sucesso!")
    else:
        print("Usuário admin já existe.")
    # Usuário willians
    if not db.query(Usuario).filter_by(username="willians").first():
        willians = Usuario(
            username="willians",
            hashed_password=Usuario.hash_password("1234"),
            is_admin=True
        )
        db.add(willians)
        print("Usuário willians criado com sucesso!")
    else:
        print("Usuário willians já existe.")
    db.commit()
    db.close()