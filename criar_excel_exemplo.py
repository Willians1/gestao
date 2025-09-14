import pandas as pd

# Dados de exemplo para valor de materiais
data = {
    'Nome': [
        'Cimento Portland CP-II',
        'Areia Fina',
        'Brita 1',
        'Ferro 10mm',
        'Tijolo Cerâmico 6 furos',
        'Tinta Látex Branca',
        'Bloco de Concreto 14x19x39'
    ],
    'Unidade': [
        'saco 50kg',
        'm³',
        'm³',
        'kg',
        'milheiro',
        'lata 18L',
        'un'
    ],
    'Valor': [
        32.50,
        85.00,
        95.00,
        6.80,
        850.00,
        180.00,
        4.25
    ],
    'Fornecedor_ID': [
        1,
        1,
        1,
        2,
        3,
        4,
        3
    ]
}

# Criar DataFrame
df = pd.DataFrame(data)

# Salvar como Excel
arquivo_excel = 'd:/2engenharia/gestao/exemplo_valor_materiais.xlsx'
df.to_excel(arquivo_excel, index=False)

print(f"Arquivo Excel criado: {arquivo_excel}")
print("\nDados incluídos:")
print(df.to_string(index=False))
