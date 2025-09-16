"""
Cria 16 usuários de manutenção (loja01..loja16) e grupos correspondentes
vinculados por cliente_id. Assume que já existam clientes com IDs 1..16
ou o suficiente; caso contrário, vincula aos primeiros clientes existentes.

Usuário: lojaXX
Senha: lojaXX
Nível: Manutenção
"""
from database import SessionLocal
from models import Usuario, GrupoUsuario, Cliente, ClienteGrupo

def run():
    db = SessionLocal()
    try:
        # Buscar clientes existentes
        clientes = db.query(Cliente).order_by(Cliente.id.asc()).all()
        if not clientes:
            print("Nenhum cliente encontrado. Crie clientes antes de rodar este seed.")
            return

        # Mapear até 16 clientes
        target = clientes[:16]
        for idx, cliente in enumerate(target, start=1):
            codigo = f"{idx:02d}"
            usern = f"loja{codigo}"
            senha = usern
            grupo_nome = f"Manutencao Loja {codigo}"

            # Criar/obter grupo
            grupo = db.query(GrupoUsuario).filter(GrupoUsuario.nome == grupo_nome).first()
            if not grupo:
                grupo = GrupoUsuario(
                    nome=grupo_nome,
                    descricao=f"Acesso restrito ao cliente_id={cliente.id}",
                    status="Aprovado",
                )
                db.add(grupo)
                db.commit()
                db.refresh(grupo)

            # Vincular cliente ao grupo (limpa vínculos prévios para garantir)
            db.query(ClienteGrupo).filter(ClienteGrupo.grupo_id == grupo.id).delete()
            db.add(ClienteGrupo(grupo_id=grupo.id, cliente_id=cliente.id))
            db.commit()

            # Criar/atualizar usuário
            user = db.query(Usuario).filter(Usuario.username == usern).first()
            pwd_hash = Usuario.hash_password(senha)
            if not user:
                user = Usuario(
                    username=usern,
                    hashed_password=pwd_hash,
                    nome=f"Técnico {usern.upper()}",
                    email=f"{usern}@exemplo.com",
                    nivel_acesso="Manutenção",
                    ativo=True,
                    grupo_id=grupo.id,
                )
                db.add(user)
            else:
                user.hashed_password = pwd_hash
                user.nivel_acesso = "Manutenção"
                user.ativo = True
                user.grupo_id = grupo.id
                db.add(user)

            db.commit()
            print(f"OK: {usern} -> grupo '{grupo_nome}' -> cliente_id={cliente.id}")

        print("Concluído.")
    finally:
        db.close()

if __name__ == "__main__":
    run()
