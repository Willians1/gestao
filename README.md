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
2) Terminal > Run Task… > `dev: all` (sobe backend em 8000 e frontend em 3005)

Ou manualmente:

```powershell
# Backend
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# Frontend (em outro terminal)
cd frontend
$env:PORT=3005; npm start
```

URLs:

- Frontend: <http://localhost:3005>
- API docs: <http://localhost:8000/docs>

## Funcionalidades prontas

- Layout com sidebar persistente em PT-BR
- Páginas com ações: Novo, Pesquisar, Importar Excel
- Importar Excel em todas as páginas, visualizar dados na DataGrid (busca + edição inline)
- Importar Excel em todas as páginas; visualização em planilha AG Grid (edição inline, copiar/colar, exportar CSV)
- Armazenamento de arquivos importados no banco de dados e listagem com link para download

## Endpoints de Upload

- `POST /uploads/{entidade}` — envia arquivo Excel e armazena no DB
- `GET /uploads?entidade=` — lista arquivos (filtra por entidade)
- `GET /uploads/{id}/download` — baixa arquivo

Entidades usadas nas páginas: `cadastro_usuarios`, `clientes`, `contratos`, `despesas`, `fornecedores`, `orcamento_obra`, `resumo_mensal`, `valor_materiais`.

## Observações

- CORS configurado para `http://localhost:3000`, `3001` e `3002`.
- O frontend usa `REACT_APP_API_URL` definido em `frontend/.env` (padrão: `http://localhost:8000`).

## Próximos passos (sugestões)

- Importação de linhas para as tabelas de domínio (endpoints batch)
- Autenticação no frontend e proteção de rotas
- Testes automatizados e lint/format (ESLint/Prettier)
