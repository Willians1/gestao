import pandas as pd
import os

# Dados de exemplo para teste
data = [
    {
        'ID': 1,
        'Descricao_Produto': 'Cimento Portland CP II-E-32',
        'Marca': 'Votorantim',
        'Unidade_Medida': 'Saca 50kg',
        'Valor_unitario': 25.50,
        'Estoque_atual': 100,
        'Estoque_Minimo': 20,
        'Data_Ultima_Entrada': '2025-08-20',
        'Responsavel': 'João Silva',
        'Fornecedor': 'Construção ABC',
        'Valor': 2550.00,
        'Localizacao': 'Depósito A - Prateleira 1',
        'Observacoes': 'Material de alta qualidade'
    },
    {
        'ID': 2,
        'Descricao_Produto': 'Vergalhão de Aço CA-50 8mm',
        'Marca': 'Gerdau',
        'Unidade_Medida': 'Barra 12m',
        'Valor_unitario': 45.80,
        'Estoque_atual': 50,
        'Estoque_Minimo': 10,
        'Data_Ultima_Entrada': '2025-08-22',
        'Responsavel': 'Maria Santos',
        'Fornecedor': 'Ferro e Aço Ltda',
        'Valor': 2290.00,
        'Localizacao': 'Pátio Externo - Setor B',
        'Observacoes': 'Verificar certificado de qualidade'
    },
    {
        'ID': 3,
        'Descricao_Produto': 'Tinta Acrílica Premium Branca',
        'Marca': 'Suvinil',
        'Unidade_Medida': 'Galão 3,6L',
        'Valor_unitario': 89.90,
        'Estoque_atual': 25,
        'Estoque_Minimo': 5,
        'Data_Ultima_Entrada': '2025-08-23',
        'Responsavel': 'Carlos Oliveira',
        'Fornecedor': 'Tintas & Cores',
        'Valor': 2247.50,
        'Localizacao': 'Depósito B - Estante 3',
        'Observacoes': 'Produto com garantia estendida'
    },
    {
        'ID': 4,
        'Descricao_Produto': 'Bloco Cerâmico 14x19x29cm',
        'Marca': 'Cerâmica Paulista',
        'Unidade_Medida': 'Milheiro',
        'Valor_unitario': 850.00,
        'Estoque_atual': 5,
        'Estoque_Minimo': 2,
        'Data_Ultima_Entrada': '2025-08-21',
        'Responsavel': 'Ana Costa',
        'Fornecedor': 'Materiais de Construção São Paulo',
        'Valor': 4250.00,
        'Localizacao': 'Pátio Externo - Área C',
        'Observacoes': 'Entrega programada para próxima semana'
    },
    {
        'ID': 5,
        'Descricao_Produto': 'Areia Média Lavada',
        'Marca': 'Mineração Santos',
        'Unidade_Medida': 'm³',
        'Valor_unitario': 75.00,
        'Estoque_atual': 30,
        'Estoque_Minimo': 10,
        'Data_Ultima_Entrada': '2025-08-24',
        'Responsavel': 'Pedro Ferreira',
        'Fornecedor': 'Areias e Pedras Ltda',
        'Valor': 2250.00,
        'Localizacao': 'Pátio de Areia - Setor 1',
        'Observacoes': 'Material certificado para concreto'
    }
]

# Criar DataFrame
df = pd.DataFrame(data)

# Salvar como Excel
output_path = 'teste_valor_materiais.xlsx'
df.to_excel(output_path, index=False, engine='openpyxl')

print(f"Arquivo Excel criado com sucesso: {output_path}")
print(f"Total de registros: {len(data)}")
print("\nColunas criadas:")
for col in df.columns:
    print(f"- {col}")
