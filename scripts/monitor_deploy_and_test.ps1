param(
  [string]$Base = 'https://gestao-backend-lbab.onrender.com',
  [int]$IntervalSeconds = 15,
  [int]$MaxWaitMinutes = 15
)

$ErrorActionPreference = 'Stop'

Write-Host "[monitor] Base: $Base"
Write-Host "[monitor] Intervalo: $IntervalSeconds s, Timeout: $MaxWaitMinutes min"

$deadline = (Get-Date).AddMinutes($MaxWaitMinutes)
$lastSha = $null
$hasAliases = $false

function Get-Health() {
  try { return Invoke-RestMethod -Method Get -Uri "$Base/healthz" -TimeoutSec 10 }
  catch { return $null }
}
function Get-OpenApi() {
  try { return Invoke-RestMethod -Method Get -Uri "$Base/openapi.json" -TimeoutSec 10 }
  catch { return $null }
}

while ((Get-Date) -lt $deadline) {
  $h = Get-Health
  if ($null -ne $h) {
  $sha = $h.commit_sha
    if (-not $lastSha) { $lastSha = $sha }
    Write-Host ("[monitor] health ok | sha=" + ($sha ? $sha : '<n/a>'))
  } else {
    Write-Host "[monitor] health indisponível"
  }

  $o = Get-OpenApi
  if (($null -ne $o) -and $o.paths) {
    $hasAliases = $o.paths.PSObject.Properties.Name -contains '/api/uploads/{entidade}' -or ($o.paths.PSObject.Properties.Name -contains '/import/contratos')
    Write-Host ("[monitor] openapi rotas=" + ($o.paths.PSObject.Properties.Name | Where-Object { $_ -match '^/api/uploads|^/import/contratos$' } | Sort-Object | ForEach-Object { $_ } | Out-String).Trim())
  } else {
    Write-Host "[monitor] openapi indisponível"
  }

  if ($hasAliases) {
    Write-Host "[monitor] Novas rotas detectadas. Executando teste de upload..."
    # Encaminha para o script existente de teste
    try {
      pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'test_upload_prod.ps1')
      Write-Host "[monitor] Teste de upload finalizado com sucesso."
      exit 0
    } catch {
      Write-Host "[monitor] Teste de upload falhou: $($_.Exception.Message)"
      exit 2
    }
  }

  Start-Sleep -Seconds $IntervalSeconds
}

Write-Error "Timeout aguardando novo deploy com aliases de upload."
exit 1
