# Script de teste para endpoints de histórico
# Testa CRUD completo de todas as tabelas de histórico

$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8000'

Write-Host "=== TESTE DE ENDPOINTS DE HISTÓRICO ===" -ForegroundColor Cyan
Write-Host ""

# Login
Write-Host "1. Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin"
} | ConvertTo-Json

$loginResp = Invoke-RestMethod -Method Post -Uri "$base/login/" -ContentType 'application/json' -Body $loginBody
$token = $loginResp.access_token
$headers = @{ Authorization = "Bearer $token" }

Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
Write-Host ""

# Teste Mão de Obra
Write-Host "2. Testando MÃO DE OBRA..." -ForegroundColor Yellow

Write-Host "   - Listando mão de obra (vazio inicial)..."
$maoList = Invoke-RestMethod -Uri "$base/mao-de-obra-historico/" -Headers $headers
Write-Host "     Total: $($maoList.Count) itens"

Write-Host "   - Criando novo registro..."
$maoBody = @{
    nome = "João Silva"
    cargo = "Pedreiro"
} | ConvertTo-Json

$maoItem = Invoke-RestMethod -Method Post -Uri "$base/mao-de-obra-historico/" -Headers $headers -ContentType 'application/json' -Body $maoBody
Write-Host "     ✅ Criado: ID=$($maoItem.id), Nome=$($maoItem.nome), Cargo=$($maoItem.cargo)"

Write-Host "   - Criando segundo registro..."
$maoBody2 = @{
    nome = "Maria Santos"
    cargo = "Eletricista"
} | ConvertTo-Json

$maoItem2 = Invoke-RestMethod -Method Post -Uri "$base/mao-de-obra-historico/" -Headers $headers -ContentType 'application/json' -Body $maoBody2
Write-Host "     ✅ Criado: ID=$($maoItem2.id), Nome=$($maoItem2.nome), Cargo=$($maoItem2.cargo)"

Write-Host "   - Listando novamente..."
$maoList2 = Invoke-RestMethod -Uri "$base/mao-de-obra-historico/" -Headers $headers
Write-Host "     Total: $($maoList2.Count) itens"

Write-Host ""

# Teste Equipamentos
Write-Host "3. Testando EQUIPAMENTOS..." -ForegroundColor Yellow

Write-Host "   - Listando equipamentos (vazio inicial)..."
$eqList = Invoke-RestMethod -Uri "$base/equipamentos-historico/" -Headers $headers
Write-Host "     Total: $($eqList.Count) itens"

Write-Host "   - Criando novo registro..."
$eqBody = @{
    nome = "Betoneira 400L"
    descricao = "Betoneira elétrica"
} | ConvertTo-Json

$eqItem = Invoke-RestMethod -Method Post -Uri "$base/equipamentos-historico/" -Headers $headers -ContentType 'application/json' -Body $eqBody
Write-Host "     ✅ Criado: ID=$($eqItem.id), Nome=$($eqItem.nome)"

Write-Host "   - Criando segundo registro..."
$eqBody2 = @{
    nome = "Martelete Pneumático"
    descricao = "Martelete para demolição"
} | ConvertTo-Json

$eqItem2 = Invoke-RestMethod -Method Post -Uri "$base/equipamentos-historico/" -Headers $headers -ContentType 'application/json' -Body $eqBody2
Write-Host "     ✅ Criado: ID=$($eqItem2.id), Nome=$($eqItem2.nome)"

Write-Host "   - Listando novamente..."
$eqList2 = Invoke-RestMethod -Uri "$base/equipamentos-historico/" -Headers $headers
Write-Host "     Total: $($eqList2.Count) itens"

Write-Host ""

# Teste Atividades
Write-Host "4. Testando ATIVIDADES..." -ForegroundColor Yellow

Write-Host "   - Listando atividades (vazio inicial)..."
$atList = Invoke-RestMethod -Uri "$base/atividades-historico/" -Headers $headers
Write-Host "     Total: $($atList.Count) itens"

Write-Host "   - Criando novo registro..."
$atBody = @{
    descricao = "Concretagem da laje do 2º pavimento"
    categoria = "Estrutura"
} | ConvertTo-Json

$atItem = Invoke-RestMethod -Method Post -Uri "$base/atividades-historico/" -Headers $headers -ContentType 'application/json' -Body $atBody
Write-Host "     ✅ Criado: ID=$($atItem.id), Descrição=$($atItem.descricao), Categoria=$($atItem.categoria)"

Write-Host "   - Criando segundo registro..."
$atBody2 = @{
    descricao = "Instalação elétrica 1º pavimento"
    categoria = "Instalações"
} | ConvertTo-Json

$atItem2 = Invoke-RestMethod -Method Post -Uri "$base/atividades-historico/" -Headers $headers -ContentType 'application/json' -Body $atBody2
Write-Host "     ✅ Criado: ID=$($atItem2.id), Descrição=$($atItem2.descricao), Categoria=$($atItem2.categoria)"

Write-Host "   - Listando novamente..."
$atList2 = Invoke-RestMethod -Uri "$base/atividades-historico/" -Headers $headers
Write-Host "     Total: $($atList2.Count) itens"

Write-Host "   - Testando filtro por categoria..."
$atFiltro = Invoke-RestMethod -Uri "$base/atividades-historico/?categoria=Estrutura" -Headers $headers
Write-Host "     Total (Estrutura): $($atFiltro.Count) itens"

Write-Host ""

# Teste Condições Climáticas
Write-Host "5. Testando CONDIÇÕES CLIMÁTICAS..." -ForegroundColor Yellow

Write-Host "   - Listando condições (vazio inicial)..."
$ccList = Invoke-RestMethod -Uri "$base/condicoes-climaticas-historico/" -Headers $headers
Write-Host "     Total: $($ccList.Count) itens"

Write-Host "   - Criando novo registro..."
$ccBody = @{
    horario_dia = "manha"
    tempo = "ensolarado"
    condicao = "seco"
    indice_pluviometrico = 0.0
    temperatura = 25.5
} | ConvertTo-Json

$ccItem = Invoke-RestMethod -Method Post -Uri "$base/condicoes-climaticas-historico/" -Headers $headers -ContentType 'application/json' -Body $ccBody
Write-Host "     ✅ Criado: ID=$($ccItem.id), Horário=$($ccItem.horario_dia), Tempo=$($ccItem.tempo), Temp=$($ccItem.temperatura)°C"

Write-Host "   - Criando segundo registro (tarde chuvosa)..."
$ccBody2 = @{
    horario_dia = "tarde"
    tempo = "chuvoso"
    condicao = "molhado"
    indice_pluviometrico = 15.3
    temperatura = 20.2
} | ConvertTo-Json

$ccItem2 = Invoke-RestMethod -Method Post -Uri "$base/condicoes-climaticas-historico/" -Headers $headers -ContentType 'application/json' -Body $ccBody2
Write-Host "     ✅ Criado: ID=$($ccItem2.id), Horário=$($ccItem2.horario_dia), Tempo=$($ccItem2.tempo), Chuva=$($ccItem2.indice_pluviometrico)mm"

Write-Host "   - Listando novamente..."
$ccList2 = Invoke-RestMethod -Uri "$base/condicoes-climaticas-historico/" -Headers $headers
Write-Host "     Total: $($ccList2.Count) itens"

Write-Host ""

# Teste de Deleção
Write-Host "6. Testando DELEÇÃO..." -ForegroundColor Yellow

Write-Host "   - Deletando primeiro item de mão de obra (ID=$($maoItem.id))..."
Invoke-RestMethod -Method Delete -Uri "$base/mao-de-obra-historico/$($maoItem.id)" -Headers $headers | Out-Null
Write-Host "     ✅ Deletado com sucesso"

Write-Host "   - Verificando lista após deleção..."
$maoFinal = Invoke-RestMethod -Uri "$base/mao-de-obra-historico/" -Headers $headers
Write-Host "     Total: $($maoFinal.Count) itens (antes: $($maoList2.Count))"

Write-Host ""

# Resumo Final
Write-Host "=== RESUMO FINAL ===" -ForegroundColor Cyan
Write-Host "✅ Mão de Obra: $($maoList2.Count) criados, 1 deletado, $($maoFinal.Count) restantes" -ForegroundColor Green
Write-Host "✅ Equipamentos: $($eqList2.Count) criados" -ForegroundColor Green
Write-Host "✅ Atividades: $($atList2.Count) criados" -ForegroundColor Green
Write-Host "✅ Condições Climáticas: $($ccList2.Count) criados" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 TODOS OS TESTES PASSARAM COM SUCESSO!" -ForegroundColor Green
