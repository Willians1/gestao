param(
  [Parameter(Mandatory=$false)][string]$BaseUrl = "https://gestao-backend-lbab.onrender.com",
  [Parameter(Mandatory=$false)][string]$NetlifyUrl
)

$ErrorActionPreference = 'Stop'
if (-not $NetlifyUrl) {
  Write-Host "Uso: pwsh -File scripts/check_healthz.ps1 -BaseUrl <backend_url> -NetlifyUrl <https://seusite.netlify.app>" -ForegroundColor Yellow
}

$res = Invoke-RestMethod -Method Get -Uri (Join-Path $BaseUrl '/healthz')
if (-not $res) { throw 'Sem resposta do healthz' }

Write-Host "status=" $res.status
Write-Host "commit_sha=" $res.commit_sha

$cors = $res.cors
if (-not $cors) { throw 'Campo cors não retornado (backend desatualizado?)' }

Write-Host "allow_origins:" ($cors.allow_origins -join ', ')
Write-Host "allow_origin_regex:" $cors.allow_origin_regex
Write-Host "netlify_url:" $cors.netlify_url

if ($NetlifyUrl) {
  $okList = $cors.allow_origins -contains $NetlifyUrl
  $okRegex = ($NetlifyUrl -match [string]$cors.allow_origin_regex)
  if (-not ($okList -or $okRegex)) {
    throw "NetlifyUrl não permitido no CORS: $NetlifyUrl"
  } else {
    Write-Host "OK: NetlifyUrl permitido pelo CORS." -ForegroundColor Green
  }
}
