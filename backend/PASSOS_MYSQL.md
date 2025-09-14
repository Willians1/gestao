# Configuração do Banco de Dados MySQL

1. Crie um banco de dados MySQL chamado `gestao_obras` (ou outro nome de sua preferência).
2. Crie um usuário e senha para acesso ao banco, ou utilize o usuário root.
3. No Windows, defina as variáveis de ambiente (pode ser via prompt ou arquivo `.env`):

```
set MYSQL_USER=seu_usuario
set MYSQL_PASSWORD=sua_senha
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set MYSQL_DB=gestao_obras
```

Ou crie um arquivo `.env` na pasta backend com o seguinte conteúdo:

```
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=gestao_obras
```

4. Instale a biblioteca `python-dotenv` para carregar variáveis do `.env` automaticamente:

```
D:/2engenharia/backend/.venv/Scripts/python.exe -m pip install python-dotenv
```

5. Execute o script para criar as tabelas:

```
D:/2engenharia/backend/.venv/Scripts/python.exe create_tables.py
```

Se tudo estiver correto, as tabelas serão criadas no banco MySQL.
