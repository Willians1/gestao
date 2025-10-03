Param(
  [string]$BaseUrl = "https://gestao-backend-lbab.onrender.com",
  [string]$LocalDataDir = ".\backend\data"
)

$ErrorActionPreference = 'Stop'

function Write-Title($text){ Write-Host "`n=== $text ===" -ForegroundColor Cyan }

# 1) Login admin
Write-Title "Login no Render (admin/admin)"
$login = Invoke-RestMethod -Method Post -Uri ($BaseUrl + "/login/") -ContentType 'application/json' -Body '{"username":"admin","password":"admin"}' -ErrorAction SilentlyContinue
if (-not $login) { $login = Invoke-RestMethod -Method Post -Uri ($BaseUrl + "/login") -ContentType 'application/json' -Body '{"username":"admin","password":"admin"}' }
if (-not $login -or -not $login.access_token) { throw "Falha ao obter token no Render" }
$headers = @{ Authorization = "Bearer $($login.access_token)" }

Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null

# 2) Baixar SQLite (preferencial) ou fallback via /backup
Write-Title "Obtendo banco SQLite do Render"
$tmpSqlite = Join-Path $env:TEMP ("gestao_render_" + [System.Guid]::NewGuid().ToString('N') + ".db")
try {
  Invoke-WebRequest -Headers $headers -Uri ($BaseUrl + "/admin/download/sqlite") -OutFile $tmpSqlite -ErrorAction Stop
} catch {
  Write-Host "Endpoint /admin/download/sqlite indisponível. Tentando via backups..." -ForegroundColor Yellow
  # Fallback: pegar o último backup
  $list = Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/backup/list") -Headers $headers -ErrorAction Stop
  if (-not $list -or -not $list[0]) {
    Write-Host "Nenhum backup disponível no Render. Disparando um backup agora..." -ForegroundColor Yellow
    # Dispara backup
    try {
      Invoke-RestMethod -Method Post -Uri ($BaseUrl + "/backup/run") -Headers $headers -ErrorAction Stop | Out-Null
    } catch {
      # Se já houver em andamento (409), segue
      if ($_.Exception.Response.StatusCode.Value__ -ne 409) { throw }
      Write-Host "Backup já em andamento no Render." -ForegroundColor Yellow
    }
    # Aguardar conclusão
    $start = Get-Date
    $timeoutMin = 10
    do {
      Start-Sleep -Seconds 3
      $prog = Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/backup/progress") -Headers $headers -ErrorAction SilentlyContinue
      $running = $false
      if ($prog) { $running = [bool]$prog.running }
      $elapsed = (Get-Date) - $start
      if ($elapsed.TotalMinutes -ge $timeoutMin) { throw "Timeout aguardando backup concluir no Render" }
    } while ($running)
    # Atualiza lista de backups
    $list = Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/backup/list") -Headers $headers -ErrorAction Stop
    if (-not $list -or -not $list[0]) { throw "Falha ao gerar backup no Render" }
  }
  $latest = $list | Sort-Object -Property created -Descending | Select-Object -First 1
  $zipUrl = $BaseUrl + "/backup/download/" + $latest.name
  $tmpZipBackup = Join-Path $env:TEMP ("render_backup_" + [System.Guid]::NewGuid().ToString('N') + ".zip")
  Write-Title ("Baixando backup: " + $latest.name)
  Invoke-WebRequest -Headers $headers -Uri $zipUrl -OutFile $tmpZipBackup -ErrorAction Stop
  if (-not (Test-Path $tmpZipBackup)) { throw "Falha ao baixar arquivo de backup" }
  # Extrair somente o SQLite para $tmpSqlite
  $zip = [System.IO.Compression.ZipFile]::OpenRead($tmpZipBackup)
  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -match 'backend/.*/gestao_obras\.db$' -or $_.FullName -eq 'backend/data/gestao_obras.db' -or $_.FullName -eq 'gestao_obras.db' } | Select-Object -First 1
    if (-not $entry) { throw "Arquivo gestao_obras.db não encontrado no backup" }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $tmpSqlite, $true)
  } finally { $zip.Dispose() }
}
if (-not (Test-Path $tmpSqlite)) { throw "Falha ao obter SQLite do Render" }

# 3) Baixar uploads.zip (preferencial) ou extrair do backup (fallback)
Write-Title "Obtendo uploads do Render"
$tmpZip = Join-Path $env:TEMP ("uploads_render_" + [System.Guid]::NewGuid().ToString('N') + ".zip")
$gotUploads = $false
try {
  Invoke-WebRequest -Headers $headers -Uri ($BaseUrl + "/admin/download/uploads.zip") -OutFile $tmpZip -ErrorAction Stop
  $gotUploads = (Test-Path $tmpZip)
} catch {
  Write-Host "Endpoint /admin/download/uploads.zip indisponível. Tentando extrair uploads do backup..." -ForegroundColor Yellow
  if (-not (Test-Path $tmpZipBackup)) {
    # Se não houver backup baixado ainda, buscar novamente o último
    $list2 = Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/backup/list") -Headers $headers -ErrorAction Stop
    if ($list2 -and $list2[0]) {
      $latest2 = $list2 | Sort-Object -Property created -Descending | Select-Object -First 1
      $tmpZipBackup = Join-Path $env:TEMP ("render_backup_" + [System.Guid]::NewGuid().ToString('N') + ".zip")
      Invoke-WebRequest -Headers $headers -Uri ($BaseUrl + "/backup/download/" + $latest2.name) -OutFile $tmpZipBackup -ErrorAction Stop
    }
  }
  if (Test-Path $tmpZipBackup) {
    # Criar um ZIP somente com uploads a partir do backup para simplificar extração depois
    $uploadsTempDir = Join-Path $env:TEMP ("uploads_extract_" + [System.Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $uploadsTempDir -Force | Out-Null
    $zipB = [System.IO.Compression.ZipFile]::OpenRead($tmpZipBackup)
    try {
      $entries = $zipB.Entries | Where-Object { $_.FullName -match '^backend/data/uploads/' }
      foreach ($e in $entries) {
        $dest = Join-Path $uploadsTempDir ($e.FullName -replace '^backend/data/uploads/', '')
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        if ($e.FullName.EndsWith('/')) { continue } # diretório
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
      }
    } finally { $zipB.Dispose() }
    # Compacta em $tmpZip
    if (Test-Path $tmpZip) { Remove-Item $tmpZip -Force -ErrorAction SilentlyContinue }
    [System.IO.Compression.ZipFile]::CreateFromDirectory($uploadsTempDir, $tmpZip)
    $gotUploads = (Test-Path $tmpZip)
  }
}

# 4) Substituir DB local com backup de segurança
Write-Title "Substituindo DB local (com backup)"
$localDb = Join-Path $LocalDataDir 'gestao_obras.db'
New-Item -ItemType Directory -Path $LocalDataDir -Force | Out-Null
if (Test-Path $localDb) {
  Copy-Item $localDb ("$localDb.bak_" + (Get-Date -Format 'yyyyMMddHHmmss')) -Force
}
Copy-Item $tmpSqlite $localDb -Force

# 5) Restaurar uploads (se baixado ou extraído do backup)
if ($gotUploads -and (Test-Path $tmpZip)) {
  Write-Title "Restaurando uploads local"
  $uploadsDir = Join-Path $LocalDataDir 'uploads'
  New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
  # Limpa uploads atuais com segurança
  Get-ChildItem -Path $uploadsDir -Recurse -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
  # Extrai o zip
  [System.IO.Compression.ZipFile]::ExtractToDirectory($tmpZip, $uploadsDir)
}

Write-Title "Concluído. Agora seu localhost reflete os dados do Render."
