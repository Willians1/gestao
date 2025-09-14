# Login PHP (SQLite)

Este módulo fornece uma alternativa simples de autenticação em PHP utilizando o mesmo banco SQLite do backend (FastAPI), eliminando erros de renderização do React.

## Estrutura
- `php/config.php`: Conexão PDO com `backend/gestao_obras.db` e função `hash_password` (SHA-256).
- `php/login.php`: Página de login (form + autenticação).
- `php/index.php`: Página inicial protegida por sessão.
- `php/logout.php`: Finaliza a sessão.
- `php/register.php`: Cadastro de novo usuário (admin/manutenção/visualização).
- `php/test_auth.php`: Teste CLI para validar existência do usuário admin/admin.

## Como rodar
No Windows (PowerShell), na pasta `gestao/php`:

```powershell
php -S localhost:8081
```

Abra: http://localhost:8081/login.php

Use um usuário existente (por exemplo, `admin` / `admin` se existir no banco e a senha for SHA-256 de `admin`).

## Observações
- A validação compara `hash('sha256', senha)` com a coluna `hashed_password` da tabela `usuarios`.
- O módulo não interfere no backend FastAPI nem no frontend React.

## Cadastro e teste
- Para cadastrar novo usuário, acesse `http://localhost:8081/register.php`.
- Um seed automático cria o usuário `admin` com senha `admin` caso não exista.
- Teste rápido via CLI (na pasta `php`):

```powershell
php .\test_auth.php
```

Saída esperada: `PASS: admin/admin válido.`
