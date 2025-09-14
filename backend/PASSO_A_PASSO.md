# Passo a Passo para rodar o sistema (FastAPI + SQLite)

## 1. Instalar dependências do backend

No terminal, execute:

```
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Criar as tabelas do banco de dados (SQLite)

No terminal, execute:

```
python create_tables.py
```

Isso criará o arquivo gestao_obras.db na pasta backend.

## 3. Rodar o backend FastAPI

No terminal, execute:

```
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Acesse http://localhost:8000/docs para testar a API.

---

O frontend React pode ser rodado normalmente em outra janela de terminal:

```
cd ../frontend
npm start
```

Acesse http://localhost:3000 para usar o sistema.
