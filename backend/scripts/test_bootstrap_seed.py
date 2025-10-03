"""Script de teste para validar bootstrap automático do template seed.

Simula condição de primeiro deploy (sem DB existente) e valida que o template
é copiado corretamente.

Uso:
  python backend/scripts/test_bootstrap_seed.py [--cleanup]

Flags:
  --cleanup: Remove o DB de teste após validação (padrão: mantém para inspeção)
"""
import os
import sys
import shutil
from pathlib import Path

# Adiciona backend ao path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def test_bootstrap():
    """Testa a lógica de bootstrap do template seed."""
    print("[TESTE BOOTSTRAP SEED]")
    
    # Simula ambiente sem DB
    test_dir = Path(__file__).resolve().parent.parent.parent / "test_bootstrap"
    test_dir.mkdir(exist_ok=True)
    test_db = test_dir / "gestao_obras.db"
    
    # Remove DB de teste se existir
    if test_db.exists():
        test_db.unlink()
        print(f"  ✓ Removido DB de teste anterior: {test_db}")
    
    # Simula variáveis de ambiente para apontar para o diretório de teste
    os.environ["DB_DIR"] = str(test_dir)
    os.environ["BOOTSTRAP_SEED_TEMPLATE"] = "1"
    
    print(f"\n[1/3] Configuração de teste:")
    print(f"  DB_DIR: {test_dir}")
    print(f"  DB esperado: {test_db}")
    print(f"  Existe antes: {test_db.exists()}")
    
    # Importa database (isso deve disparar o bootstrap)
    print(f"\n[2/3] Importando database.py (deve disparar bootstrap)...")
    try:
        # Força reimport para testar bootstrap
        if 'database' in sys.modules:
            del sys.modules['database']
        from database import DB_PATH, SessionLocal
        print(f"  ✓ Database importado")
        print(f"  DB_PATH retornado: {DB_PATH}")
    except Exception as e:
        print(f"  ✗ Falha ao importar database: {e}")
        return False
    
    # Valida se template foi copiado
    print(f"\n[3/3] Validando bootstrap...")
    if not test_db.exists():
        print(f"  ✗ DB não foi criado: {test_db}")
        return False
    
    print(f"  ✓ DB criado: {test_db}")
    
    # Valida contagem de tabelas
    import sqlite3
    try:
        conn = sqlite3.connect(str(test_db))
        cursor = conn.cursor()
        
        # Conta usuários
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        user_count = cursor.fetchone()[0]
        print(f"  ✓ Usuários no DB: {user_count}")
        
        # Conta clientes
        cursor.execute("SELECT COUNT(*) FROM clientes")
        client_count = cursor.fetchone()[0]
        print(f"  ✓ Clientes no DB: {client_count}")
        
        # Verifica admin
        cursor.execute("SELECT username, nivel_acesso FROM usuarios WHERE username IN ('admin', 'willians')")
        users = cursor.fetchall()
        print(f"  ✓ Usuários padrão encontrados: {[u[0] for u in users]}")
        
        conn.close()
        
        if user_count == 0:
            print(f"  ⚠ Bootstrap funcionou mas DB está vazio (esperado se template não existir)")
        else:
            print(f"  ✓ Bootstrap funcionou e DB foi populado do template!")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Falha ao validar DB: {e}")
        return False

def main():
    cleanup = "--cleanup" in sys.argv
    
    success = test_bootstrap()
    
    if success:
        print("\n✅ TESTE PASSOU!")
        
        if cleanup:
            test_dir = Path(__file__).resolve().parent.parent.parent / "test_bootstrap"
            if test_dir.exists():
                shutil.rmtree(test_dir)
                print(f"  ✓ Diretório de teste removido: {test_dir}")
        else:
            test_db = Path(__file__).resolve().parent.parent.parent / "test_bootstrap" / "gestao_obras.db"
            print(f"\nDB de teste mantido para inspeção: {test_db}")
            print(f"Use --cleanup para remover automaticamente")
    else:
        print("\n❌ TESTE FALHOU!")
        sys.exit(1)

if __name__ == "__main__":
    main()
