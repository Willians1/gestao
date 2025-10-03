"""Script para preparar template seed SQLite para bootstrap em produção.

Uso:
  python backend/scripts/prepare_seed_template.py

Funcionalidade:
  1. Conecta ao DB atual (via database.DB_PATH)
  2. Gera backup timestampado
  3. Copia o DB atual para backend/seed_template/gestao_obras_seed.db
  4. Valida integridade (contagens de tabelas principais)
  
Pré-requisitos:
  - DB local deve estar populado com dados desejados (clientes, usuarios, etc.)
  - Rodará ensure_admin_user e ensure_willians_user no template gerado
"""
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Adiciona backend ao path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from database import DB_PATH, SessionLocal
except Exception as e:
    print(f"[ERRO] Falha ao importar database: {e}")
    sys.exit(1)

from models import Cliente, Usuario, Contrato, Fornecedor

def validate_db_counts(db_path: str) -> dict:
    """Retorna contagem de registros principais para validação."""
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    counts = {}
    tables = ["clientes", "usuarios", "contratos", "fornecedores"]
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            counts[table] = cursor.fetchone()[0]
        except Exception:
            counts[table] = -1
    conn.close()
    return counts

def ensure_template_users(template_path: str):
    """Garante que o template tenha admin e willians com senhas padrão."""
    import sqlite3
    import hashlib
    conn = sqlite3.connect(template_path)
    cursor = conn.cursor()
    
    # Admin
    admin_hash = hashlib.sha256("admin".encode()).hexdigest()
    cursor.execute("SELECT id FROM usuarios WHERE username = ?", ("admin",))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("admin", admin_hash, "Administrador", "admin@thors.com", "Admin", True))
    else:
        cursor.execute("""
            UPDATE usuarios 
            SET hashed_password = ?, nivel_acesso = ?, ativo = 1
            WHERE username = ?
        """, (admin_hash, "Admin", "admin"))
    
    # Willians
    willians_hash = hashlib.sha256("willians".encode()).hexdigest()
    cursor.execute("SELECT id FROM usuarios WHERE username = ?", ("willians",))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("willians", willians_hash, "Willians", "willians@thors.com", "willians", True))
    else:
        cursor.execute("""
            UPDATE usuarios 
            SET hashed_password = ?, nivel_acesso = ?, ativo = 1
            WHERE username = ?
        """, (willians_hash, "willians", "willians"))
    
    conn.commit()
    conn.close()
    print("  ✓ Garantidos usuários admin e willians no template")

def main():
    if not DB_PATH or not os.path.exists(DB_PATH):
        print(f"[ERRO] DB_PATH não disponível ou arquivo não existe: {DB_PATH}")
        sys.exit(1)
    
    # Determina diretórios
    backend_dir = Path(__file__).resolve().parent.parent
    seed_template_dir = backend_dir / "seed_template"
    seed_template_dir.mkdir(exist_ok=True)
    
    template_dest = seed_template_dir / "gestao_obras_seed.db"
    
    print(f"[PREPARAR SEED TEMPLATE]")
    print(f"  Origem: {DB_PATH}")
    print(f"  Destino: {template_dest}")
    
    # Valida DB atual
    print("\n[1/4] Validando DB atual...")
    counts = validate_db_counts(DB_PATH)
    print(f"  Clientes: {counts.get('clientes', 0)}")
    print(f"  Usuários: {counts.get('usuarios', 0)}")
    print(f"  Contratos: {counts.get('contratos', 0)}")
    print(f"  Fornecedores: {counts.get('fornecedores', 0)}")
    
    if counts.get('usuarios', 0) == 0:
        print("  ⚠ Nenhum usuário encontrado no DB atual. Considere popular antes.")
    
    # Gera backup do DB atual antes de qualquer operação
    print("\n[2/4] Gerando backup do DB atual...")
    try:
        root = backend_dir.parent
        backups_dir = root / "backups"
        backups_dir.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"gestao_obras_pre_template_{timestamp}.db"
        backup_path = backups_dir / backup_name
        shutil.copy2(DB_PATH, backup_path)
        print(f"  ✓ Backup salvo: {backup_path}")
    except Exception as e:
        print(f"  ⚠ Falha ao gerar backup: {e}")
    
    # Copia para template
    print("\n[3/4] Copiando para template seed...")
    try:
        shutil.copy2(DB_PATH, template_dest)
        print(f"  ✓ Template criado: {template_dest}")
    except Exception as e:
        print(f"  [ERRO] Falha ao copiar: {e}")
        sys.exit(1)
    
    # Garante usuários padrão no template
    print("\n[4/4] Ajustando usuários padrão no template...")
    try:
        ensure_template_users(str(template_dest))
    except Exception as e:
        print(f"  ⚠ Falha ao ajustar usuários: {e}")
    
    # Valida template final
    print("\n[VALIDAÇÃO FINAL]")
    final_counts = validate_db_counts(str(template_dest))
    print(f"  Clientes: {final_counts.get('clientes', 0)}")
    print(f"  Usuários: {final_counts.get('usuarios', 0)}")
    print(f"  Contratos: {final_counts.get('contratos', 0)}")
    print(f"  Fornecedores: {final_counts.get('fornecedores', 0)}")
    
    print("\n✅ Template seed pronto!")
    print(f"\nPróximos passos:")
    print(f"  1. Valide o arquivo: {template_dest}")
    print(f"  2. Commite o template no repositório (se < 100MB)")
    print(f"  3. Configure DB_DIR no Render apontando para volume persistente")
    print(f"  4. No próximo deploy, o template será copiado se DB não existir")
    print(f"\nAlternativa (upload manual):")
    print(f"  - Baixe via: GET /admin/backup/sqlite")
    print(f"  - Suba manualmente para o volume do Render antes do primeiro start")

if __name__ == "__main__":
    main()
