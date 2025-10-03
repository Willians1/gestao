#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Faz upload do template seed para o Render via endpoint de restore.

.DESCRIPTION
    Este script:
    1. Faz login na API do Render
    2. Faz upload do backend/seed_template/gestao_obras_seed.db
    3. O backend faz backup automático do DB atual antes de substituir
    4. Valida que o restore funcionou verificando contagens

.PARAMETER BaseUrl
    URL base da API no Render (ex: https://gestao-backend-lbab.onrender.com)

.PARAMETER Username
    Username para autenticação (padrão: admin)

.PARAMETER Password
    Senha para autenticação (padrão: admin)

.PARAMETER TemplatePath
    Caminho para o arquivo seed (padrão: backend\seed_template\gestao_obras_seed.db)

.EXAMPLE
    .\upload_template_to_render.ps1 -BaseUrl https://gestao-backend-lbab.onrender.com
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,
    
    [string]$Username = "admin",
    [string]$Password = "admin",
    [string]$TemplatePath = "backend\seed_template\gestao_obras_seed.db"
)

$ErrorActionPreference = 'Stop'

Write-Host "`n=== UPLOAD TEMPLATE SEED PARA RENDER ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Template: $TemplatePath" -ForegroundColor Gray

# Valida que template existe
if (-not (Test-Path $TemplatePath)) {
    Write-Host "`n✗ Template não encontrado: $TemplatePath" -ForegroundColor Red
    Write-Host "Execute primeiro: .\backend\scripts\prepare_seed_template.py" -ForegroundColor Yellow
    exit 1
}

$templateInfo = Get-Item $TemplatePath
$sizeMB = [math]::Round($templateInfo.Length / 1MB, 2)
Write-Host "Tamanho: $sizeMB MB`n" -ForegroundColor Gray

# 1. Login
Write-Host "[1/4] Fazendo login..." -ForegroundColor Yellow
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
} catch {
    Write-Host "  ✗ Login falhou: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# 2. Verificar DB atual
Write-Host "`n[2/4] Verificando DB atual..." -ForegroundColor Yellow
try {
    $dbinfo = Invoke-RestMethod -Uri "$BaseUrl/debug/dbinfo" -Method Get -Headers $headers
    Write-Host "  ✓ DB atual: $($dbinfo.db_path)" -ForegroundColor Gray
    Write-Host "  ✓ Exists: $($dbinfo.exists)" -ForegroundColor Gray
    
    $statsBefore = Invoke-RestMethod -Uri "$BaseUrl/debug/stats" -Method Get -Headers $headers
    Write-Host "  ✓ Usuários antes: $($statsBefore.usuarios)" -ForegroundColor Gray
    Write-Host "  ✓ Clientes antes: $($statsBefore.clientes)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Falha ao verificar DB: $_" -ForegroundColor Red
    exit 1
}

# 3. Upload do template
Write-Host "`n[3/4] Fazendo upload do template..." -ForegroundColor Yellow
Write-Host "  (Aguarde, pode levar alguns segundos...)" -ForegroundColor Gray

try {
    # Preparar multipart form data
    $fileBytes = [System.IO.File]::ReadAllBytes($TemplatePath)
    $fileContent = [System.Net.Http.ByteArrayContent]::new($fileBytes)
    $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/octet-stream")
    
    $multipartContent = [System.Net.Http.MultipartFormDataContent]::new()
    $multipartContent.Add($fileContent, "file", "gestao_obras_seed.db")
    
    $httpClient = [System.Net.Http.HttpClient]::new()
    $httpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $token)
    $httpClient.Timeout = [TimeSpan]::FromMinutes(5)
    
    $response = $httpClient.PostAsync("$BaseUrl/admin/backup/sqlite/restore", $multipartContent).Result
    $responseBody = $response.Content.ReadAsStringAsync().Result
    
    if (-not $response.IsSuccessStatusCode) {
        throw "HTTP $($response.StatusCode): $responseBody"
    }
    
    $result = $responseBody | ConvertFrom-Json
    
    Write-Host "  ✓ Upload concluído!" -ForegroundColor Green
    Write-Host "  ✓ DB restaurado: $($result.db_path)" -ForegroundColor Green
    Write-Host "  ✓ Backup anterior salvo: $($result.backup_path)" -ForegroundColor Green
    Write-Host "  ✓ Tamanho processado: $([math]::Round($result.size_bytes / 1MB, 2)) MB" -ForegroundColor Green
    
} catch {
    Write-Host "  ✗ Upload falhou: $_" -ForegroundColor Red
    exit 1
} finally {
    if ($httpClient) { $httpClient.Dispose() }
}

# 4. Validar resultado
Write-Host "`n[4/4] Validando resultado..." -ForegroundColor Yellow
Start-Sleep -Seconds 2  # Aguarda um pouco para garantir que DB foi atualizado

try {
    $statsAfter = Invoke-RestMethod -Uri "$BaseUrl/debug/stats" -Method Get -Headers $headers
    Write-Host "  ✓ Usuários depois: $($statsAfter.usuarios)" -ForegroundColor Green
    Write-Host "  ✓ Clientes depois: $($statsAfter.clientes)" -ForegroundColor Green
    Write-Host "  ✓ Contratos depois: $($statsAfter.contratos)" -ForegroundColor Green
    
    if ($statsAfter.usuarios -ge 16 -and $statsAfter.clientes -ge 16) {
        Write-Host "`n✅ TEMPLATE APLICADO COM SUCESSO!" -ForegroundColor Green
        Write-Host "  Template seed foi restaurado na produção" -ForegroundColor Green
        Write-Host "  Backup do DB anterior foi salvo automaticamente" -ForegroundColor Green
    } else {
        Write-Host "`n⚠ Upload funcionou, mas contagens inesperadas" -ForegroundColor Yellow
        Write-Host "  Esperado: >= 16 usuários e >= 16 clientes" -ForegroundColor Yellow
        Write-Host "  Obtido: $($statsAfter.usuarios) usuários, $($statsAfter.clientes) clientes" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "  ✗ Falha ao validar: $_" -ForegroundColor Red
    Write-Host "  Upload pode ter funcionado, mas validação falhou" -ForegroundColor Yellow
}

Write-Host ""
