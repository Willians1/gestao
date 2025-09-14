# Script para corrigir todas as páginas com tema escuro

# Lista de páginas principais para corrigir
$paginas = @(
    "Clientes.js",
    "Despesas.js", 
    "Fornecedores.js",
    "OrcamentoObra.js",
    "ResumoMensal.js",
    "ValorMateriais.js",
    "Contratos.js"
)

foreach ($pagina in $paginas) {
    $arquivo = "frontend\src\pages\$pagina"
    
    if (Test-Path $arquivo) {
        Write-Host "Corrigindo $pagina..."
        
        # Ler conteúdo do arquivo
        $conteudo = Get-Content -Path $arquivo -Raw
        
        # Adicionar import useTheme se não existir
        if ($conteudo -notmatch "import.*useTheme") {
            $conteudo = $conteudo -replace "(import.*from '@mui/material';)", "`$1`nimport { useTheme } from '@mui/material/styles';"
        }
        
        # Adicionar const theme se não existir
        if ($conteudo -notmatch "const theme = useTheme\(\);") {
            $conteudo = $conteudo -replace "function\s+\w+\(\)\s*\{", "`$0`n  const theme = useTheme();"
        }
        
        # Corrigir backgrounds fixos
        $conteudo = $conteudo -replace "background: '#f8fafb'", "background: theme.palette.background.default"
        $conteudo = $conteudo -replace "background: '#f4f6f8'", "background: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#f4f6f8'"
        
        # Salvar arquivo
        Set-Content -Path $arquivo -Value $conteudo -Encoding UTF8
        
        Write-Host "Corrigido $pagina"
    }
}

Write-Host "Todas as paginas foram corrigidas!"
