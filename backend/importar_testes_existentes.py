#!/usr/bin/env python3
"""
Script para verificar e importar dados de testes existentes no banco de dados
"""

import sqlite3
from datetime import datetime, date, time
import json

def verificar_dados_existentes():
    """Verifica se já existem dados nas tabelas de testes"""
    try:
        conn = sqlite3.connect('gestao_obras.db')
        cursor = conn.cursor()

        # Verificar dados existentes
        cursor.execute('SELECT COUNT(*) FROM testes_loja')
        loja_count = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM testes_ar_condicionado')
        ar_count = cursor.fetchone()[0]

        print(f'📊 Dados existentes:')
        print(f'   Testes Loja: {loja_count} registros')
        print(f'   Testes Ar Condicionado: {ar_count} registros')

        if loja_count > 0:
            cursor.execute('SELECT id, data_teste, cliente_id, status, observacao FROM testes_loja LIMIT 5')
            print('\n🔍 Primeiros 5 registros de testes_loja:')
            for row in cursor.fetchall():
                print(f'   ID: {row[0]}, Data: {row[1]}, Cliente: {row[2]}, Status: {row[3]}, Obs: {row[4][:50] if row[4] else "N/A"}')

        if ar_count > 0:
            cursor.execute('SELECT id, data_teste, cliente_id, status, observacao FROM testes_ar_condicionado LIMIT 5')
            print('\n🔍 Primeiros 5 registros de testes_ar_condicionado:')
            for row in cursor.fetchall():
                print(f'   ID: {row[0]}, Data: {row[1]}, Cliente: {row[2]}, Status: {row[3]}, Obs: {row[4][:50] if row[4] else "N/A"}')

        conn.close()
        return loja_count, ar_count

    except Exception as e:
        print(f'❌ Erro ao verificar dados: {e}')
        return 0, 0

def importar_dados_teste():
    """Importa dados de exemplo para as tabelas de testes"""
    try:
        conn = sqlite3.connect('gestao_obras.db')
        cursor = conn.cursor()

        # Verificar se existem clientes
        cursor.execute('SELECT COUNT(*) FROM clientes')
        clientes_count = cursor.fetchone()[0]

        if clientes_count == 0:
            print('⚠️  Nenhum cliente encontrado. Criando clientes de exemplo...')

            clientes_exemplo = [
                ('Cliente A', '12.345.678/0001-90', 'clienteA@email.com', 'João Silva'),
                ('Cliente B', '98.765.432/0001-10', 'clienteB@email.com', 'Maria Santos'),
                ('Cliente C', '11.222.333/0001-44', 'clienteC@email.com', 'Pedro Oliveira'),
            ]

            for nome, cnpj, email, contato in clientes_exemplo:
                cursor.execute('''
                    INSERT INTO clientes (nome, cnpj, email, contato)
                    VALUES (?, ?, ?, ?)
                ''', (nome, cnpj, email, contato))

            print('✅ Clientes de exemplo criados')

        # Obter IDs dos clientes
        cursor.execute('SELECT id, nome FROM clientes LIMIT 3')
        clientes = cursor.fetchall()

        if not clientes:
            print('❌ Nenhum cliente encontrado após tentativa de criação')
            return

        print(f'\n📝 Importando dados de teste para {len(clientes)} clientes...')

        # Dados de exemplo para testes_loja
        dados_loja = []
        for i, (cliente_id, cliente_nome) in enumerate(clientes):
            for dia in range(1, 4):  # 3 dias por cliente
                dados_loja.append((
                    f'2024-09-{10 + i * 3 + dia:02d}',  # Datas diferentes
                    cliente_id,
                    f'{8 + i}:00:00',  # Horários diferentes
                    f'foto_teste_loja_{cliente_id}_{dia}.jpg',
                    f'video_teste_loja_{cliente_id}_{dia}.mp4',
                    'OK' if dia % 2 == 0 else 'OFF',
                    f'Teste realizado com sucesso - Cliente {cliente_nome}' if dia % 2 == 0 else f'Problema identificado - Cliente {cliente_nome}',
                    1,  # criado_por (admin)
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    1   # atualizado_por
                ))

        # Inserir dados na tabela testes_loja
        cursor.executemany('''
            INSERT INTO testes_loja
            (data_teste, cliente_id, horario, foto, video, status, observacao, criado_por, criado_em, atualizado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', dados_loja)

        # Dados de exemplo para testes_ar_condicionado
        dados_ar = []
        for i, (cliente_id, cliente_nome) in enumerate(clientes):
            for dia in range(1, 3):  # 2 dias por cliente
                dados_ar.append((
                    f'2024-09-{15 + i * 2 + dia:02d}',  # Datas diferentes
                    cliente_id,
                    f'{10 + i}:30:00',  # Horários diferentes
                    f'foto_ar_{cliente_id}_{dia}.jpg',
                    f'video_ar_{cliente_id}_{dia}.mp4',
                    'OK' if dia % 2 == 1 else 'OFF',
                    f'Ar condicionado funcionando perfeitamente - Cliente {cliente_nome}' if dia % 2 == 1 else f'Manutenção necessária no ar condicionado - Cliente {cliente_nome}',
                    1,  # criado_por (admin)
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    1   # atualizado_por
                ))

        # Inserir dados na tabela testes_ar_condicionado
        cursor.executemany('''
            INSERT INTO testes_ar_condicionado
            (data_teste, cliente_id, horario, foto, video, status, observacao, criado_por, criado_em, atualizado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', dados_ar)

        conn.commit()
        conn.close()

        print(f'✅ Importação concluída!')
        print(f'   Testes Loja: {len(dados_loja)} registros importados')
        print(f'   Testes Ar Condicionado: {len(dados_ar)} registros importados')

    except Exception as e:
        print(f'❌ Erro durante importação: {e}')

if __name__ == '__main__':
    print('🚀 Verificando dados existentes...')
    loja_count, ar_count = verificar_dados_existentes()

    if loja_count == 0 and ar_count == 0:
        print('\n📥 Nenhum dado encontrado. Iniciando importação...')
        importar_dados_teste()
    else:
        print('\n✅ Dados já existem no banco. Nenhuma ação necessária.')

    print('\n🔄 Verificação final...')
    verificar_dados_existentes()
