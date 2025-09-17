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
