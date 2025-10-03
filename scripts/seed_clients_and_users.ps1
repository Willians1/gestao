param(
  [Parameter(Mandatory=$false)] [string]$BaseUrl = 'https://gestao-backend-lbab.onrender.com',
  [Parameter(Mandatory=$false)] [int]$Count = 16
)

$ErrorActionPreference = 'Stop'

Write-Host ("[seed] Base=" + $BaseUrl)

# Login admin
$loginBody = @{ username = 'admin'; password = 'admin' } | ConvertTo-Json -Compress
$login = Invoke-RestMethod -Method Post -Uri ($BaseUrl + '/login') -ContentType 'application/json' -Body $loginBody
$token = $login.access_token
if (-not $token) { throw 'Falha ao obter token de admin' }
$headers = @{ Authorization = ("Bearer " + $token) }

# Chamar endpoint de seed
$seedUri = $BaseUrl + '/admin/seed_clientes_lojas'
if ($Count -ne 16) {
  $seedUri = $seedUri + ('?count=' + $Count)
}
try {
  $resp = Invoke-RestMethod -Method Post -Uri $seedUri -Headers $headers -ErrorAction Stop
  Write-Host ("[seed] Resultado (endpoint admin):")
  $resp | ConvertTo-Json -Depth 5
}
catch {
  Write-Warning "Endpoint admin/seed_clientes_lojas não disponível. Executando fallback via API pública."
  # Fallback: criar clientes Loja 01..N
  $clientes = @()
  try { $clientes = Invoke-RestMethod -Method Get -Uri ($BaseUrl + '/clientes/') -Headers $headers -ErrorAction Stop }
  catch { Write-Warning "Falha ao listar clientes. Prosseguindo com tentativas de criação." }
  $existentes = @{}
  foreach ($c in $clientes) { $existentes[$c.nome] = $true }
  $createdC = 0
  for ($i=1; $i -le $Count; $i++) {
    $nome = ('Loja ' + ($i.ToString('00')))
    if (-not $existentes[$nome]) {
      $body = @{ nome = $nome } | ConvertTo-Json -Compress
      try {
        Invoke-RestMethod -Method Post -Uri ($BaseUrl + '/clientes/') -Headers $headers -ContentType 'application/json' -Body $body -ErrorAction Stop | Out-Null
        $createdC++
      }
      catch { Write-Warning ("Ignorando erro ao criar cliente '" + $nome + "': " + $_.Exception.Message) }
    }
  }
  Write-Host ("[seed] Clientes criados: " + $createdC)

  # Fallback: criar usuários admin/willians/loja01..loja16 se faltarem
  $usuarios = @()
  try { $usuarios = Invoke-RestMethod -Method Get -Uri ($BaseUrl + '/usuarios/') -Headers $headers -ErrorAction Stop }
  catch { Write-Warning "Falha ao listar usuários. Continuando com criação." }
  $usersByName = @{}
  foreach ($u in $usuarios) { $usersByName[$u.username] = $true }

  function Ensure-User($uname, $pwd, $nivel) {
    if (-not $usersByName[$uname]) {
      $uBody = @{ username=$uname; password=$pwd; nome=$uname; email=($uname + '@exemplo.com'); nivel_acesso=$nivel; ativo=$true } | ConvertTo-Json -Compress
      try {
        Invoke-RestMethod -Method Post -Uri ($BaseUrl + '/usuarios/') -Headers $headers -ContentType 'application/json' -Body $uBody -ErrorAction Stop | Out-Null
        Write-Host ("[seed] Criado usuário: " + $uname)
      }
      catch { Write-Warning ("Ignorando erro ao criar usuário '" + $uname + "': " + $_.Exception.Message) }
    }
  }

  # Garante willians e lojas; admin já deve existir
  Ensure-User -uname 'willians' -pwd 'willians' -nivel 'willians'
  for ($i=1; $i -le $Count; $i++) {
    $code = $i.ToString('00')
    $uname = 'loja' + $code
    Ensure-User -uname $uname -pwd $uname -nivel 'Manutenção'
  }
}

# Verificar stats
$stats = Invoke-RestMethod -Method Get -Uri ($BaseUrl + '/debug/stats') -Headers $headers
Write-Host ("[stats] usuarios=" + $stats.usuarios + ", clientes=" + $stats.clientes)
