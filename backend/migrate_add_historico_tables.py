"""
Migração: Adiciona tabelas de histórico para autocompletar
- mao_de_obra_historico
- equipamentos_historico
- atividades_historico
- condicoes_climaticas_historico
"""

import sys
import os

# Adiciona o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.database import SQLALCHEMY_DATABASE_URL, CONNECT_ARGS

def migrate():
    print("Criando tabelas de histórico para autocompletar...")
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=CONNECT_ARGS)
    
    # SQL para criar as tabelas
    sql_statements = [
        # Tabela de histórico de mão de obra
        """
        CREATE TABLE IF NOT EXISTS mao_de_obra_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome VARCHAR NOT NULL,
            cargo VARCHAR,
            cliente_id INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            criado_por INTEGER,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            FOREIGN KEY (criado_por) REFERENCES usuarios(id)
        )
        """,
        
        # Tabela de histórico de equipamentos
        """
        CREATE TABLE IF NOT EXISTS equipamentos_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome VARCHAR NOT NULL,
            descricao TEXT,
            cliente_id INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            criado_por INTEGER,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            FOREIGN KEY (criado_por) REFERENCES usuarios(id)
        )
        """,
        
        # Tabela de histórico de atividades
        """
        CREATE TABLE IF NOT EXISTS atividades_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao VARCHAR NOT NULL,
            categoria VARCHAR,
            cliente_id INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            criado_por INTEGER,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            FOREIGN KEY (criado_por) REFERENCES usuarios(id)
        )
        """,
        
        # Tabela de histórico de condições climáticas
        """
        CREATE TABLE IF NOT EXISTS condicoes_climaticas_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            horario_dia VARCHAR,
            tempo VARCHAR,
            condicao VARCHAR,
            indice_pluviometrico REAL,
            temperatura REAL,
            cliente_id INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            criado_por INTEGER,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            FOREIGN KEY (criado_por) REFERENCES usuarios(id)
        )
        """
    ]
    
    with engine.connect() as conn:
        for sql in sql_statements:
            conn.execute(text(sql))
            conn.commit()
    
    print("✅ Tabelas de histórico criadas com sucesso!")
    print("   - mao_de_obra_historico")
    print("   - equipamentos_historico")
    print("   - atividades_historico")
    print("   - condicoes_climaticas_historico")

if __name__ == "__main__":
    migrate()
