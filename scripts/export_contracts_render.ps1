Param(
  [string]$BaseUrl = "https://gestao-backend-lbab.onrender.com"
)
$ErrorActionPreference = 'Stop'

# Login no Render (tenta /login/ e depois /login)
$login = Invoke-RestMethod -Method Post -Uri ($BaseUrl + "/login/") -ContentType 'application/json' -Body '{"username":"admin","password":"admin"}' -ErrorAction SilentlyContinue
if (-not $login) { $login = Invoke-RestMethod -Method Post -Uri ($BaseUrl + "/login") -ContentType 'application/json' -Body '{"username":"admin","password":"admin"}' }
if (-not $login -or -not $login.access_token) { throw "Falha ao obter token no Render" }
$headers = @{ Authorization = "Bearer $($login.access_token)" }

# Buscar contratos do Render (tenta rotas alternativas)
$urls = @(
  "/contratos/",
  "/contratos",
  "/api/contratos",
  "/api/contratos/"
)
$contratos = $null
foreach ($u in $urls) {
  try {
    $resp = Invoke-RestMethod -Method Get -Uri ($BaseUrl + $u) -Headers $headers -ErrorAction Stop
    if ($resp) { $contratos = $resp; break }
  } catch {
    continue
  }
}
if (-not $contratos) { throw "Falha ao obter contratos do Render" }

# Normaliza para array
if ($contratos -isnot [System.Array]) {
  if ($contratos.items) { $contratos = $contratos.items }
  elseif ($contratos.data) { $contratos = $contratos.data }
  elseif ($contratos.results) { $contratos = $contratos.results }
  elseif ($contratos.contratos) { $contratos = $contratos.contratos }
  else { $contratos = @($contratos) }
}

# Salvar em JSON temporário
$tmp = Join-Path $env:TEMP ("contratos_render_" + [System.Guid]::NewGuid().ToString('N') + ".json")
$contratos | ConvertTo-Json -Depth 6 | Out-File -FilePath $tmp -Encoding UTF8
Write-Host ("Exportado JSON: " + $tmp)
