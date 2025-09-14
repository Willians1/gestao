#!/usr/bin/env python3
import sqlite3
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def check_database():
    print("🔍 VERIFICANDO BANCO DE DADOS")
    print("=" * 40)

    conn = sqlite3.connect('backend/gestao_obras.db')
    cursor = conn.cursor()

    try:
        # Verificar usuários
        cursor.execute("SELECT username, hashed_password, nivel_acesso FROM usuarios")
        users = cursor.fetchall()

        print(f"👥 Usuários encontrados: {len(users)}")
        for user in users:
            print(f"   - {user[0]} ({user[2]})")
            print(f"     Hash: {user[1][:20]}...")

            # Testar hash
            if user[0] == 'admin':
                test_hash = hash_password("admin")
                match = user[1] == test_hash
                print(f"     Hash admin OK: {match}")

        conn.close()
        return len(users) > 0

    except Exception as e:
        print(f"❌ Erro no banco: {e}")
        return False

def test_backend_connection():
    print("\n🌐 TESTANDO CONEXÃO BACKEND")
    print("=" * 40)

    try:
        import requests
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend está respondendo (porta 8000)")
            return True
        else:
            print(f"❌ Backend retornou status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

if __name__ == "__main__":
    db_ok = check_database()
    backend_ok = test_backend_connection()

    print("\n📊 RESULTADO:")
    print(f"   Banco: {'✅ OK' if db_ok else '❌ FAIL'}")
    print(f"   Backend: {'✅ OK' if backend_ok else '❌ FAIL'}")

    if db_ok and backend_ok:
        print("\n🎯 SISTEMA PRONTO PARA LOGIN!")
        print("🔑 Credenciais:")
        print("   admin / admin")
        print("   manutencao / 123456")
    else:
        print("\n⚠️ PROBLEMAS DETECTADOS!")
