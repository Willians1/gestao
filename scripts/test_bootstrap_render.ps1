#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Testa bootstrap e persistência do SQLite no Render.

.DESCRIPTION
    Valida:
    - Login funcional
    - Endpoint /debug/dbinfo retorna db_path e exists
    - db_path aponta para volume persistente (não /tmp)
    - Contagens de clientes e usuários
    - Template seed foi aplicado (se primeiro deploy)

.PARAMETER BaseUrl
    URL base da API no Render (ex: https://gestao-backend-lbab.onrender.com)

.PARAMETER Username
    Username para autenticação (padrão: admin)

.PARAMETER Password
    Senha para autenticação (padrão: admin)

.EXAMPLE
    .\test_bootstrap_render.ps1 -BaseUrl https://gestao-backend-lbab.onrender.com
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,
    
    [string]$Username = "admin",
    [string]$Password = "admin"
)

$ErrorActionPreference = 'Stop'

Write-Host "`n=== TESTE BOOTSTRAP RENDER ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray

# 1. Health check
Write-Host "`n[1/5] Health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/healthz" -Method Get
    Write-Host "  ✓ Status: $($health.status)" -ForegroundColor Green
    if ($health.commit_sha) {
        Write-Host "  ✓ Commit: $($health.commit_sha.Substring(0, 7))" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Health check falhou: $_" -ForegroundColor Red
    exit 1
}

# 2. Login
Write-Host "`n[2/5] Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = $Username
        password = $Password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/login/" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.access_token
    
    if (-not $token) {
        throw "Token não retornado"
    }
    
    Write-Host "  ✓ Login bem-sucedido" -ForegroundColor Green
    Write-Host "  ✓ Token obtido: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "  ✗ Login falhou: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# 3. Debug DB Info
Write-Host "`n[3/5] Verificando DB info..." -ForegroundColor Yellow
try {
    $dbinfo = Invoke-RestMethod -Uri "$BaseUrl/debug/dbinfo" -Method Get -Headers $headers
    
    Write-Host "  ✓ DB Path: $($dbinfo.db_path)" -ForegroundColor Green
    Write-Host "  ✓ Exists: $($dbinfo.exists)" -ForegroundColor Green
    
    if (-not $dbinfo.exists) {
        Write-Host "  ✗ ERRO: DB não existe!" -ForegroundColor Red
        Write-Host "  Verifique:" -ForegroundColor Yellow
        Write-Host "    - Variável DB_DIR ou DATA_DIR está configurada?" -ForegroundColor Yellow
        Write-Host "    - Disk está montado no Render?" -ForegroundColor Yellow
        exit 1
    }
    
    # Valida se está em /tmp (ephemeral - problema!)
    if ($dbinfo.db_path -like "*/tmp/*" -or $dbinfo.db_path -like "*\tmp\*") {
        Write-Host "  ⚠ AVISO: DB está em /tmp (ephemeral)!" -ForegroundColor Yellow
        Write-Host "    Dados serão perdidos a cada deploy!" -ForegroundColor Yellow
        Write-Host "    Configure DB_DIR apontando para o Disk montado" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ DB em diretório persistente" -ForegroundColor Green
    }
    
} catch {
    Write-Host "  ✗ Falha ao obter DB info: $_" -ForegroundColor Red
    exit 1
}

# 4. Verificar contagens
Write-Host "`n[4/5] Verificando contagens..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$BaseUrl/debug/stats" -Method Get -Headers $headers
    
    Write-Host "  ✓ Usuários: $($stats.usuarios)" -ForegroundColor Green
    Write-Host "  ✓ Clientes: $($stats.clientes)" -ForegroundColor Green
    Write-Host "  ✓ Contratos: $($stats.contratos)" -ForegroundColor Green
    
    if ($stats.usuarios -eq 0) {
        Write-Host "  ⚠ Nenhum usuário encontrado!" -ForegroundColor Yellow
        Write-Host "    Template seed pode não ter sido aplicado" -ForegroundColor Yellow
        Write-Host "    Ou DB foi criado vazio antes do template estar disponível" -ForegroundColor Yellow
    } elseif ($stats.usuarios -ge 16) {
        Write-Host "  ✓ Template seed parece ter sido aplicado (>= 16 usuários)" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Usuários encontrados (pode ser seed mínimo ou manual)" -ForegroundColor Green
    }
    
} catch {
    Write-Host "  ✗ Falha ao obter stats: $_" -ForegroundColor Red
    exit 1
}

# 5. Listar clientes (primeiros 5)
Write-Host "`n[5/5] Listando primeiros clientes..." -ForegroundColor Yellow
try {
    $clientes = Invoke-RestMethod -Uri "$BaseUrl/clientes" -Method Get -Headers $headers
    
    if ($clientes -is [array] -and $clientes.Count -gt 0) {
        $first5 = $clientes | Select-Object -First 5
        foreach ($c in $first5) {
            Write-Host "  - Cliente #$($c.id): $($c.nome)" -ForegroundColor Gray
        }
        Write-Host "  ✓ Total de clientes: $($clientes.Count)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Nenhum cliente encontrado" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "  ✗ Falha ao listar clientes: $_" -ForegroundColor Red
}

# Resumo
Write-Host "`n=== RESUMO ===" -ForegroundColor Cyan
Write-Host "✓ API está funcional" -ForegroundColor Green
Write-Host "✓ Autenticação funcionando" -ForegroundColor Green
Write-Host "✓ DB existe: $($dbinfo.exists)" -ForegroundColor $(if ($dbinfo.exists) { "Green" } else { "Red" })

if ($dbinfo.db_path -like "*/tmp/*" -or $dbinfo.db_path -like "*\tmp\*") {
    Write-Host "⚠ ATENÇÃO: Configure persistência!" -ForegroundColor Yellow
    Write-Host "`nPróximos passos:" -ForegroundColor Cyan
    Write-Host "  1. No Render, adicione um Disk ao serviço" -ForegroundColor White
    Write-Host "  2. Defina DB_DIR=/var/data/gestao (ou caminho do Disk)" -ForegroundColor White
    Write-Host "  3. Faça novo deploy" -ForegroundColor White
    Write-Host "  4. Execute este script novamente para validar" -ForegroundColor White
} else {
    Write-Host "✓ Persistência parece configurada" -ForegroundColor Green
    
    if ($stats.usuarios -eq 0) {
        Write-Host "`nSugestão: Se esperava dados do template seed:" -ForegroundColor Cyan
        Write-Host "  - Template está comitado no repositório?" -ForegroundColor White
        Write-Host "  - Variável BOOTSTRAP_SEED_TEMPLATE=1?" -ForegroundColor White
        Write-Host "  - Pode ter criado DB vazio antes do deploy com template" -ForegroundColor White
        Write-Host "  - Solução: fazer upload manual via /admin/backup/sqlite" -ForegroundColor White
    }
}

Write-Host ""
