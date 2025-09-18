# Gestão de Obras — Monorepo (FastAPI + React)

Aplicação full-stack para gestão (Cadastros, Clientes, Contratos, Despesas, Fornecedores, Orçamento de Obra, Resumo Mensal, Valor de Materiais) com importação de Excel e armazenamento dos arquivos no banco para download futuro.

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite, Uvicorn
- Frontend: React 18, MUI, AG Grid (planilha), React Router
- Import Excel: SheetJS (frontend) e Pandas (backend opcional)

## Estrutura

- `backend/` — API FastAPI + modelo SQLAlchemy (SQLite `gestao_obras.db`)
- `frontend/` — SPA React com MUI e AG Grid

## Requisitos

- Node.js 18+
- Python 3.11+ (ou compatível com o `.venv` local)
- Windows PowerShell (para comandos abaixo)

## Como rodar (rápido)

Usando tasks do VS Code:

1) Terminal > Run Task… > `Instalar backend (venv)`
2) Terminal > Run Task… > `dev: all` (sobe backend em 8000 e frontend em 3001)

Ou manualmente:

```powershell
# Backend
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# Frontend (em outro terminal)
cd frontend
$env:PORT=3001; npm start
```

URLs:

- Frontend: <http://localhost:3001>
- API docs: <http://localhost:8000/docs>

## Funcionalidades prontas

- Layout com sidebar persistente em PT-BR
- Páginas com ações: Novo, Pesquisar, Importar Excel
- Importar Excel em todas as páginas, visualizar dados na DataGrid (busca + edição inline)
- Importar Excel em todas as páginas; visualização em planilha AG Grid (edição inline, copiar/colar, exportar CSV)
- Armazenamento de arquivos importados no banco de dados e listagem com link para download
- Autenticação com JWT (login) e controle de acesso baseado em grupos/permissões
  - IDs fixos por página/ação (ex.: Usuários 1101=ver, 1102=editar, 1103=excluir, 1104=criar; Clientes 1201..1204 etc.)
  - Backend aplica enforcement por endpoint (POST/PUT/DELETE exigem permissões específicas)
  - Frontend oculta/desabilita botões conforme permissões do usuário logado

## Endpoints de Upload

- `POST /uploads/{entidade}` — envia arquivo Excel e armazena no DB
- `GET /uploads?entidade=` — lista arquivos (filtra por entidade)
- `GET /uploads/{id}/download` — baixa arquivo

Entidades usadas nas páginas: `cadastro_usuarios`, `clientes`, `contratos`, `despesas`, `fornecedores`, `orcamento_obra`, `resumo_mensal`, `valor_materiais`.

## Observações

- CORS configurado para `http://localhost:3000`, `3001` e `3005` (dev) e domínios Render.
- O frontend usa `REACT_APP_API_URL` definido em `frontend/.env` (padrão: `http://localhost:8000`).
- Login de teste: usuário `admin`, senha `admin`. Este usuário possui nível que libera todas as permissões.

### Usuários padrão (seed)

Para agilizar o start em desenvolvimento, o backend garante os seguintes usuários no mesmo banco usado pela API:

- admin / admin — nível Admin (acesso total)
- willians / willians — nível Willians (tratado como admin)
- loja01 … loja16 — senhas iguais ao próprio login (ex.: loja07/loja07), nível "Manutenção", vinculados a clientes 1..16

Notas:

- A criação/normalização do usuário admin é controlada pela variável de ambiente `SEED_ADMIN` ("1" por padrão em dev). Em produção, defina `SEED_ADMIN=0` para evitar reset de senha automático.
- A criação/normalização do usuário `willians` é controlada por `SEED_WILLIANS` ("1" por padrão). Defina `SEED_WILLIANS=0` se não desejar esse usuário automático.
- As lojas 01..16 são criadas/atualizadas pelo script `backend/seed_initial_users_and_clients.py`, que também garante 16 clientes de exemplo e os respectivos grupos de manutenção.

## Changelog

### 2025-09-17

- Frontend: limpeza completa de warnings (ESLint/Prettier) nas páginas principais (Dashboard, Usuários, Grupos, Clientes, Contratos, Despesas, Fornecedores, Orçamento de Obra, Resumo Mensal, Valor Materiais, Testes) com:
  - Padronização de loaders com `useCallback` e ajustes das dependências de `useEffect`.
  - Remoção de imports/variáveis não utilizados e pequenos ajustes de formatação.
  - Correção de casos `switch` com `default` em `GruposUsuariosNovo`.
  - Ajustes de polling de backup no Dashboard para evitar `no-use-before-define`.
- Configuração: padronização da porta do frontend para 3001 nas tasks e `.env`.

## Deploy no Render

Este repositório contém um `render.yaml` com três serviços:

- Backend (FastAPI): `gestao-backend` (runtime: python)
- Frontend (React estático): `gestao-frontend` (runtime: static)
- PHP (opcional): `gestao-php` (runtime: docker)

URLs esperadas (podem variar conforme o Render provisiona):

- Backend: <https://gestao-backend-XXXX.onrender.com/healthz>
- Frontend: <https://gestao-frontend.onrender.com>

Passos rápidos:

1) Faça push na branch `main` (auto deploy habilitado no `render.yaml`).
2) O Render vai executar:
   - Backend: `pip install -r backend/requirements.txt` e iniciar `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
   - Frontend: `cd frontend && npm ci && npm run build` e publicar `frontend/build`.
3) Verifique os health checks e navegue até a URL do frontend.

Variáveis de ambiente relevantes:

- Backend
  - `ALLOW_ORIGINS` inclui os domínios de dev e os domínios do Render do frontend.
  - `SECRET_KEY`, `APP_VERSION`, `BUILD_TIME`, `RENDER_GIT_COMMIT` (preenchidos automaticamente na plataforma).
- Frontend (serviço estático)
  - `REACT_APP_API_URL` deve apontar para a URL pública do backend (já configurado em `render.yaml`).

Observações importantes:

- SQLite: o banco (`backend/gestao_obras.db`) fica no filesystem do container. Para produção com persistência, configure um Disk no Render e aponte o caminho do DB para esse volume.
- Diretório de dados: o backend detecta automaticamente um diretório gravável (DATA_DIR/DB_DIR, ou `/var/data`, `/data`, `backend/data`, `/tmp`). O SQLite, backups e uploads serão salvos lá. Em produção no Render, crie um Disk e exporte a variável `DATA_DIR` apontando para o mount.
- SPA: o serviço estático já inclui rewrite `/* -> /index.html`.

### Troubleshooting no Render

- CORS no navegador: confira `ALLOW_ORIGINS` no backend e a URL do frontend.
- 404 na SPA em refresh: verifique a regra de rewrite no `render.yaml` do serviço estático.
- Frontend chama backend errado: valide `REACT_APP_API_URL` no serviço `gestao-frontend`.
- Backend sem escrever no DB: SQLite pode estar somente leitura; use um Disk e ajuste o caminho do DB em `backend/database.py` se necessário.

## Permissões (resumo)

- Páginas mapeadas e seus IDs base (leitura):
  - Usuários: 1101 (editar: 1102, excluir: 1103, criar: 1104)
  - Clientes: 1201 (editar: 1202, excluir: 1203, criar: 1204)
  - Fornecedores: 1301 (editar: 1302, excluir: 1303, criar: 1304)
  - Contratos: 1401 (editar: 1402, excluir: 1403, criar: 1404)
  - Orçamento de Obra: 1501 (editar: 1502, excluir: 1503, criar: 1504)
  - Despesas: 1601 (editar: 1602, excluir: 1603, criar: 1604)
  - Valor Materiais: 1701 (editar: 1702, excluir: 1703, criar: 1704)
  - Resumo Mensal: 1801 (editar: 1802, excluir: 1803, criar: 1804)

No backend, endpoints GET exigem ao menos o ID base (leitura). Endpoints POST/PUT/DELETE exigem os IDs específicos de criar/editar/excluir. Usuários com nível `Admin` ou `Willians` têm acesso total.

## Próximos passos (sugestões)

- Importação de linhas para as tabelas de domínio (endpoints batch)
- Autenticação no frontend e proteção de rotas
- Testes automatizados e lint/format (ESLint/Prettier)

---

## PostgreSQL (produção e sync local)

O backend também funciona com `DATABASE_URL` (PostgreSQL), com fallback automático para SQLite quando a variável não está definida. No Render, o `render.yaml` já injeta `DATABASE_URL` via serviço de banco `gestao-postgres`.

Dump/restore usando Docker (sem instalar psql):

```powershell
# 1) Dump de produção para arquivo prod.dump
$env:PGHOST = 'SEU_HOST'
$env:PGUSER = 'SEU_USER'
$env:PGPASSWORD = 'SEU_PASS'
$env:PGDATABASE = 'SEU_DB'

docker run --rm -v ${PWD}:/backup -e PGPASSWORD=$env:PGPASSWORD postgres:16 `
  pg_dump -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -Fc -f /backup/prod.dump

# 2) Restore no Postgres local
$env:LOCAL_DB = 'gestao_local'
$env:LOCAL_USER = 'postgres'
$env:LOCAL_PASS = 'postgres'

docker run --rm -v ${PWD}:/backup -e PGPASSWORD=$env:LOCAL_PASS postgres:16 `
  sh -c "dropdb -h host.docker.internal -U $env:LOCAL_USER --if-exists $env:LOCAL_DB && `
         createdb -h host.docker.internal -U $env:LOCAL_USER $env:LOCAL_DB && `
         pg_restore -h host.docker.internal -U $env:LOCAL_USER -d $env:LOCAL_DB --clean --no-owner /backup/prod.dump"
```

Para desenvolver localmente com Postgres, defina `DATABASE_URL` (por exemplo):

```text
postgresql+psycopg://postgres:postgres@localhost:5432/gestao_local
```

Sem `DATABASE_URL`, o app usa SQLite automaticamente.

### Migração de dados: SQLite → PostgreSQL

O repositório inclui um script para migrar dados do SQLite para o Postgres preservando IDs e ajustando sequences:

1) Garanta que o Postgres de destino esteja acessível e que `DATABASE_URL` aponte para ele.
2) Rode a migração informando o arquivo SQLite de origem (se não informar, o script tenta descobrir automaticamente):

```powershell
$env:DATABASE_URL = "postgresql+psycopg://<user>:<pass>@<host>:<port>/<db>"
python backend/migrate_sqlite_to_postgres.py --sqlite backend/gestao_obras.db --truncate
```

Notas:

- Use `--truncate` quando quiser limpar o destino antes de inserir (recomendado em bancos vazios ou recém-criados).
- Após a migração, valide no backend (em produção/local) se os usuários padrão existem e conseguem logar:
  - admin/admin
  - willians/willians
  - loja01/loja01 … loja16/loja16
- Se necessário, execute também: `python backend/seed_initial_users_and_clients.py` para garantir 16 clientes e os usuários de manutenção.
