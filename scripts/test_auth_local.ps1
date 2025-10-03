Param(
  [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = 'Stop'

function Write-Title($text){ Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Try-Login($url){
  try {
    return Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body '{"username":"admin","password":"admin"}' -ErrorAction Stop
  } catch { return $null }
}

Write-Title "Login (admin/admin)"
$login = Try-Login ("$BaseUrl/login/")
if (-not $login) { $login = Try-Login ("$BaseUrl/login") }
if (-not $login -or -not $login.access_token) {
  Write-Host "Falha no login. Verifique se o backend está em $BaseUrl e se o usuário admin existe." -ForegroundColor Red
  exit 1
}
$token = $login.access_token
Write-Host "Token obtido com sucesso." -ForegroundColor Green
$headers = @{ Authorization = "Bearer $token" }

$checks = @(
  @{ path = "/me/"; desc = "Dados do usuário" },
  @{ path = "/me/permissoes"; desc = "Permissões do usuário" },
  @{ path = "/me/clientes"; desc = "Clientes permitidos" },
  @{ path = "/testes-loja/"; desc = "Listar Testes Loja" },
  @{ path = "/testes-ar-condicionado/"; desc = "Listar Testes Ar" },
  @{ path = "/backup/status"; desc = "Status de Backup (admin)" }
)

foreach ($c in $checks) {
  $u = "$BaseUrl$($c.path)"
  try {
    $resp = Invoke-RestMethod -Method Get -Uri $u -Headers $headers -ErrorAction Stop
    $summary = ($resp | ConvertTo-Json -Compress)
    if ($summary.Length -gt 200) { $summary = $summary.Substring(0, 200) + '...' }
    Write-Host ("OK $($c.desc): " + $summary) -ForegroundColor Green
  }
  catch {
    $status = $_.Exception.Response.StatusCode.Value__
    Write-Host ("ERRO $($c.desc) -> HTTP $status ($u)") -ForegroundColor Yellow
  }
}

Write-Host "`nConcluído. Se via frontend ainda aparece 401, confirme que o app fez login e está enviando o header Authorization: Bearer <token>." -ForegroundColor Cyan

.venv\Scripts\Activate.ps1
python backend/scripts/repair_and_sync_clients.py --json caminho\clientes_export.json --purge-dummies
