Param(
  [string]$BaseUrl = "https://gestao-backend-lbab.onrender.com"
)
$ErrorActionPreference = 'Stop'

# Login no Render
$login = Invoke-RestMethod -Method Post -Uri ($BaseUrl + "/login/") -ContentType 'application/json' -Body '{"username":"admin","password":"admin"}' -ErrorAction SilentlyContinue
if (-not $login) { $login = Invoke-RestMethod -Method Post -Uri ($BaseUrl + "/login") -ContentType 'application/json' -Body '{"username":"admin","password":"admin"}' }
if (-not $login -or -not $login.access_token) { throw "Falha ao obter token no Render" }
$headers = @{ Authorization = "Bearer $($login.access_token)" }

# Buscar clientes do Render
$clientes = Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/clientes/") -Headers $headers

# Salvar em JSON temporário
$tmp = Join-Path $env:TEMP ("clientes_render_" + [System.Guid]::NewGuid().ToString('N') + ".json")
$clientes | ConvertTo-Json -Depth 6 | Out-File -FilePath $tmp -Encoding UTF8
Write-Host ("Exportado JSON: " + $tmp)
