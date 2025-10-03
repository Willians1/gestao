# Template Seed SQLite

Este diretório contém o arquivo **template seed** (`gestao_obras_seed.db`) usado para bootstrap automático em produção quando o banco de dados não existe.

## Como funciona?

No startup do backend (`main.py`), se:
- A variável `BOOTSTRAP_SEED_TEMPLATE=1` (padrão)
- O arquivo SQLite principal (definido por `DB_PATH`) **não existir**
- Existir um template em `backend/seed_template/gestao_obras_seed.db`

Então o template é **copiado automaticamente** para o local correto, garantindo que a aplicação não inicie vazia.

## Como preparar o template?

1. Popule seu banco local com os dados desejados (clientes, usuários, contratos, etc.)
2. Execute o script de preparação:
   ```bash
   .venv\Scripts\Activate.ps1
   python backend/scripts/prepare_seed_template.py
   ```
3. O script irá:
   - Validar o DB atual
   - Gerar backup de segurança
   - Copiar para `backend/seed_template/gestao_obras_seed.db`
   - Garantir usuários admin e willians
   - Validar o template gerado

## Deploy no Render

### Opção 1: Template versionado (arquivo < 100MB)
1. Commite o `gestao_obras_seed.db` gerado
2. Configure `DB_DIR` no Render apontando para o volume persistente
3. No deploy, o template será copiado automaticamente se DB não existir

### Opção 2: Upload manual
1. Baixe o DB atual via GET `/admin/backup/sqlite`
2. No Render, antes do primeiro start:
   - Acesse o shell do serviço
   - Crie o diretório definido em `DB_DIR`
   - Copie o arquivo baixado para `$DB_DIR/gestao_obras.db`
3. Inicie o serviço normalmente

## Variáveis de ambiente relevantes

- `DB_DIR` ou `DATA_DIR`: diretório onde o SQLite será salvo (aponte para volume persistente!)
- `BOOTSTRAP_SEED_TEMPLATE`: `1` (padrão) habilita cópia automática do template
- `SEED_ADMIN`, `SEED_WILLIANS`, `SEED_LOJAS`: controlam seeds incrementais no startup

## Segurança

- **Nunca** inclua senhas sensíveis ou dados de produção reais no template versionado
- Use apenas dados de exemplo ou básicos (admin/willians com senhas padrão)
- Para ambientes de produção reais, prefira upload manual do backup

## Validação

Após deploy, verifique via:
```bash
curl https://sua-api.render.com/debug/dbinfo -H "Authorization: Bearer $TOKEN"
```

Deve retornar `exists: true` e `db_path` apontando para o volume persistente.
