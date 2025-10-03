# Guia: Aplicar Template Seed em Produção (Render)

Este guia explica como aplicar o template seed em um ambiente de produção que **já possui um DB SQLite**, mas sem os dados esperados.

## Situação Atual (Render)

- ✅ DB existe: `/opt/render/project/src/backend/data/gestao_obras.db`
- ⚠️ Apenas 1 usuário (admin seed mínimo)
- ⚠️ 0 clientes, 0 contratos
- Template seed não foi aplicado (DB já existia antes do template estar disponível)

## Opções para Aplicar o Template

### Opção 1: Upload via API (Recomendada)

**Pré-requisito:** Baixar backup do template localmente

```powershell
# 1. Baixar o template seed (0.61 MB)
Copy-Item "backend\seed_template\gestao_obras_seed.db" "template_backup.db"
```

**Via endpoint de backup (se implementado upload):**

```powershell
# Login
$base = "https://gestao-backend-lbab.onrender.com"
$body = '{"username":"admin","password":"admin"}'
$token = (Invoke-RestMethod -Method Post -Uri "$base/login/" -ContentType 'application/json' -Body $body).access_token

# Upload (precisa endpoint POST /admin/backup/sqlite/restore)
# TODO: implementar endpoint de restore
```

### Opção 2: Shell do Render (Manual)

**Requer:** Acesso ao shell do serviço no painel do Render

```bash
# 1. Conectar ao shell do serviço no painel do Render

# 2. Fazer backup do DB atual
cd /opt/render/project/src/backend/data
cp gestao_obras.db gestao_obras_backup_$(date +%Y%m%d_%H%M%S).db

# 3. Baixar template do repositório
cd /tmp
git clone --depth 1 https://github.com/Willians1/gestao.git
cp gestao/backend/seed_template/gestao_obras_seed.db /opt/render/project/src/backend/data/gestao_obras.db

# 4. Verificar permissões
chmod 644 /opt/render/project/src/backend/data/gestao_obras.db

# 5. Reiniciar serviço (via painel Render)
```

### Opção 3: Recriar DB do Zero (Forçar Bootstrap)

**Atenção:** Perde dados atuais!

```bash
# No shell do Render
cd /opt/render/project/src/backend/data
mv gestao_obras.db gestao_obras_old_$(date +%Y%m%d_%H%M%S).db
# Reiniciar serviço -> bootstrap automático copiará o template
```

### Opção 4: Configurar Disk Persistente + Forçar Bootstrap

Se ainda não há Disk configurado:

1. **No painel do Render:**
   - Adicionar Disk (ex.: `/var/data/gestao`, 1GB)
   - Definir variável `DB_DIR=/var/data/gestao`

2. **Remover DB ephemeral:**
   ```bash
   # No shell
   rm /opt/render/project/src/backend/data/gestao_obras.db
   ```

3. **Fazer deploy:**
   - Push para main (ou manual deploy)
   - Bootstrap automático copiará o template para `/var/data/gestao/gestao_obras.db`
   - Próximos deploys manterão os dados

## Validação Pós-Aplicação

Execute o script de teste:

```powershell
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File scripts/test_bootstrap_render.ps1 -BaseUrl https://gestao-backend-lbab.onrender.com
```

Resultado esperado:
```
✓ Usuários: 19
✓ Clientes: 16
✓ Contratos: 1
✓ Template seed parece ter sido aplicado (>= 16 usuários)
```

## Implementar Endpoint de Restore (TODO)

Para facilitar a Opção 1, adicionar endpoint:

```python
@app.post("/admin/backup/sqlite/restore")
def admin_restore_sqlite(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user)
):
    """Restaura DB a partir de arquivo upload (admin only)."""
    if str(current_user.nivel_acesso or '').lower() not in {"admin", "willians"}:
        raise HTTPException(status_code=403, detail="Apenas admin")
    
    # Backup do atual
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = DB_PATH.replace('.db', f'_pre_restore_{timestamp}.db')
    shutil.copy2(DB_PATH, backup_path)
    
    # Substituir
    with open(DB_PATH, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    
    return {"status": "ok", "backup": backup_path}
```

## Notas

- Template atual: 16 clientes (Cliente 01..16), 19 usuários (admin, willians, loja01..loja16), 1 contrato
- Senhas padrão: admin/admin, willians/willians, loja01/loja01, etc.
- Para ambientes com dados sensíveis, sanitize o template antes de commitar
- Use Disk persistente para garantir que dados sobrevivam a deploys
