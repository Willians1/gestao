param(
  [string]$Base = 'https://gestao-backend-lbab.onrender.com',
  [string]$Username = 'admin',
  [string]$Password = 'admin'
)

$ErrorActionPreference = 'Stop'

Write-Host "Base: $Base"

# Login (tenta /login e /login/)
$loginBody = @{ username = $Username; password = $Password } | ConvertTo-Json
$baseUrl = $Base.TrimEnd('/')
$login = $null
$loginUrls = @(
  ($baseUrl + '/login'),
  ($baseUrl + '/login/')
)
foreach ($lu in $loginUrls) {
  try {
    $login = Invoke-RestMethod -Method Post -Uri $lu -ContentType 'application/json' -Body $loginBody -ErrorAction Stop
    if ($login -and $login.access_token) { break }
  } catch {
    # Continua para próxima variação
    continue
  }
}
if (-not $login -or -not $login.access_token) { throw 'Falha ao obter token (tentativas: /login e /login/)' }
$headers = @{ Authorization = ('Bearer ' + $login.access_token) }
Write-Host "Login OK"

# Baixar template para pasta temporária
$tmpDir = Join-Path $env:TEMP 'ctimport'
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
$xlsx = Join-Path $tmpDir 'template_contratos.xlsx'
Invoke-WebRequest -Headers $headers -Uri ($baseUrl + '/templates/contratos') -OutFile $xlsx
if (-not (Test-Path $xlsx)) { throw 'Falha ao baixar template' }
Write-Host "Template salvo em: $xlsx"

# Form-data: usar o arquivo diretamente para multipart
$form = @{ file = Get-Item -LiteralPath $xlsx }

function Invoke-UploadRoute([string]$Url){
  Write-Host ("Tentando: " + $Url)
  try {
    return Invoke-RestMethod -Method Post -Uri $Url -Headers $headers -Form $form -ErrorAction Stop
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.StatusCode) {
      Write-Host ("HTTP " + [int]$resp.StatusCode)
      try {
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $reader.ReadToEnd()
        if ($body) { Write-Host "Erro corpo: $body" }
      } catch {}
    } else {
      Write-Host ("Erro: " + $_.Exception.Message)
    }
    return $null
  }
}

$routes = @(
  ($baseUrl + '/api/uploads/contratos'),
  ($baseUrl + '/import/contratos'),
  ($baseUrl + '/uploads/contratos')
)

$result = $null
foreach ($r in $routes) {
  $result = Invoke-UploadRoute $r
  if ($result) { break }
}

if (-not $result) {
  throw 'Upload falhou em todas as rotas.'
}

Write-Host ("Upload result: entidade=" + $result.entidade + ", imported=" + $result.records_imported)
