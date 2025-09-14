#!/usr/bin/env python3
"""
Script de teste DEFINITIVO do sistema de login
Testa TUDO: banco, API, autenticação
"""
import sqlite3
import hashlib
import requests
import json
import sys

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def test_database():
    print("🔍 TESTE 1: BANCO DE DADOS")
    print("=" * 40)
    
    conn = sqlite3.connect('backend/gestao_obras.db')
    cursor = conn.cursor()
    
    try:
        # Verificar se a tabela existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'")
        if not cursor.fetchone():
            print("❌ Tabela usuarios não existe")
            return False
        
        print("✅ Tabela usuarios existe")
        
        # Verificar estrutura
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"📋 Colunas: {columns}")
        
        # Contar usuários
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        count = cursor.fetchone()[0]
        print(f"👤 Total de usuários: {count}")
        
        if count == 0:
            print("🔧 Criando usuários de teste...")
            
            # Criar admin
            admin_hash = hash_password("admin")
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("admin", admin_hash, "Administrador", "admin@thors.com", "Admin", 1))
            
            # Criar manutenção
            manutencao_hash = hash_password("123456")
            cursor.execute("""
                INSERT INTO usuarios (username, hashed_password, nome, email, nivel_acesso, ativo)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("manutencao", manutencao_hash, "Usuário Manutenção", "manutencao@thors.com", "Manutenção", 1))
            
            conn.commit()
            print("✅ Usuários criados!")
        
        # Listar usuários
        cursor.execute("SELECT username, nivel_acesso, ativo FROM usuarios")
        users = cursor.fetchall()
        print(f"👥 Usuários:")
        for user in users:
            status = "🟢" if user[2] else "🔴"
            print(f"   {status} {user[0]} ({user[1]})")
        
        # Verificar hash do admin
        cursor.execute("SELECT hashed_password FROM usuarios WHERE username = 'admin'")
        admin_data = cursor.fetchone()
        if admin_data:
            stored_hash = admin_data[0]
            test_hash = hash_password("admin")
            match = stored_hash == test_hash
            print(f"🔐 Hash admin: {'✅ OK' if match else '❌ FALHOU'}")
            return match
        
        return False
        
    except Exception as e:
        print(f"❌ Erro no banco: {e}")
        return False
    finally:
        conn.close()

def test_api():
    print("\n🌐 TESTE 2: API BACKEND")
    print("=" * 40)
    
    try:
        # Testar se o backend responde
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend está online (porta 8000)")
        else:
            print(f"❌ Backend retornou status {response.status_code}")
            return False
        
        # Testar login admin
        print("🔑 Testando login admin...")
        login_data = {
            "username": "admin",
            "password": "admin"
        }
        
        response = requests.post(
            "http://localhost:8000/login/",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        print(f"📊 Status: {response.status_code}")
        print(f"📝 Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print("✅ Login admin SUCESSO!")
                print(f"🎫 Token: {data['access_token'][:50]}...")
                return True
            else:
                print("❌ Login retornou 200 mas sem token")
                return False
        else:
            print(f"❌ Login admin FALHOU!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Não foi possível conectar ao backend (porta 8000)")
        return False
    except Exception as e:
        print(f"❌ Erro na API: {e}")
        return False

def test_frontend():
    print("\n🖥️ TESTE 3: FRONTEND")
    print("=" * 40)
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend está online (porta 3000)")
            return True
        else:
            print(f"❌ Frontend retornou status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Não foi possível conectar ao frontend (porta 3000)")
        return False
    except Exception as e:
        print(f"❌ Erro no frontend: {e}")
        return False

def main():
    print("🚀 TESTE COMPLETO DO SISTEMA THORS")
    print("=" * 50)
    
    results = {
        "database": test_database(),
        "api": test_api(),
        "frontend": test_frontend()
    }
    
    print("\n📊 RESULTADO FINAL")
    print("=" * 50)
    
    success_count = sum(results.values())
    total_tests = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper():<12}: {status}")
    
    print(f"\n🎯 RESULTADO: {success_count}/{total_tests} testes passaram")
    
    if success_count == total_tests:
        print("\n🎉 SISTEMA ESTÁ FUNCIONANDO PERFEITAMENTE!")
        print("🔑 Use as credenciais:")
        print("   👤 admin / admin")
        print("   🔧 manutencao / 123456")
        print("\n🌐 URLs:")
        print("   Frontend: http://localhost:3000")
        print("   Backend:  http://localhost:8000/docs")
    else:
        print("\n⚠️ ALGUNS PROBLEMAS ENCONTRADOS!")
        print("Verifique os logs acima para detalhes.")
    
    return success_count == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
