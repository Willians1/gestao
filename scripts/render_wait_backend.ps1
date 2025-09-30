param(
  [string]$Base = 'https://gestao-backend-lbab.onrender.com',
  [int]$TimeoutMinutes = 15,
  [int]$IntervalSeconds = 10
)
$ErrorActionPreference = 'Stop'

Write-Host ("[wait] Base=" + $Base)
$end = (Get-Date).AddMinutes($TimeoutMinutes)

function Has-Routes(){
  try {
    $spec = Invoke-RestMethod -Method Get -Uri ($Base.TrimEnd('/') + '/openapi.json') -TimeoutSec 10
    if ($null -eq $spec.paths) { return $false }
    $p = $spec.paths.PSObject.Properties.Name
    return ($p -contains '/api/uploads/{entidade}') -and ($p -contains '/import/contratos')
  } catch { return $false }
}

while ((Get-Date) -lt $end) {
  if (Has-Routes) {
    Write-Host "[wait] Rotas detectadas."
    exit 0
  }
  Write-Host "[wait] Ainda não. Aguardando..."
  Start-Sleep -Seconds $IntervalSeconds
}

Write-Error "Timeout aguardando rotas no backend"
exit 1
