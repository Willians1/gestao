param(
  [ValidateSet('backend','frontend','both')]
  [string]$Target = 'both',
  [string]$BackendHook = $env:RENDER_BACKEND_DEPLOY_HOOK_URL,
  [string]$FrontendHook = $env:RENDER_FRONTEND_DEPLOY_HOOK_URL,
  [string]$ApiKey = $env:RENDER_API_KEY,
  [string]$BackendServiceId = $env:RENDER_BACKEND_SERVICE_ID,
  [string]$FrontendServiceId = $env:RENDER_FRONTEND_SERVICE_ID
)

$ErrorActionPreference = 'Stop'

function Invoke-DeployHook([string]$Url){
  if (-not $Url) { throw 'URL de Deploy Hook ausente.' }
  Write-Host ("[deploy] POST " + $Url)
  Invoke-WebRequest -UseBasicParsing -Method Post -Uri $Url | Out-Null
}

function Invoke-RenderApiDeploy([string]$ServiceId){
  if (-not $ApiKey) { throw 'RENDER_API_KEY ausente para uso da API.' }
  if (-not $ServiceId) { throw 'ServiceId ausente para uso da API.' }
  $headers = @{ Authorization = ("Bearer " + $ApiKey); 'Content-Type' = 'application/json' }
  $uri = "https://api.render.com/v1/services/$ServiceId/deploys"
  Write-Host ("[deploy] POST " + $uri)
  $resp = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body '{}' -ErrorAction Stop
  return $resp
}

function Trigger-Backend(){
  if ($BackendHook) { Invoke-DeployHook $BackendHook; return }
  if ($ApiKey -and $BackendServiceId) { $r = Invoke-RenderApiDeploy $BackendServiceId; Write-Host ("[deploy] backend id=" + $r.id) ; return }
  throw 'Não há BackendHook nem API/ServiceId para backend.'
}

function Trigger-Frontend(){
  if ($FrontendHook) { Invoke-DeployHook $FrontendHook; return }
  if ($ApiKey -and $FrontendServiceId) { $r = Invoke-RenderApiDeploy $FrontendServiceId; Write-Host ("[deploy] frontend id=" + $r.id); return }
  throw 'Não há FrontendHook nem API/ServiceId para frontend.'
}

switch ($Target) {
  'backend'  { Trigger-Backend } 
  'frontend' { Trigger-Frontend }
  'both'     { 
    try { Trigger-Backend } catch { Write-Warning $_.Exception.Message }
    try { Trigger-Frontend } catch { Write-Warning $_.Exception.Message }
  }
}

Write-Host "[deploy] Disparo de deploy concluído."
