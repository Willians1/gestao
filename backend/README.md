# Backend (FastAPI)

Como executar neste monorepo:

```powershell
# no diretório do projeto
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Documentação da API: <http://localhost:8000/docs>

Observações:

- Banco SQLite em `backend/gestao_obras.db`.
- CORS liberado para <http://localhost:3000>, <http://localhost:3001> e <http://localhost:3002>.
- Endpoints de upload: POST /uploads/{entidade}, GET /uploads?entidade=, GET /uploads/{id}/download.
