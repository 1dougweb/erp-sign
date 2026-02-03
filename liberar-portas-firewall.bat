# Script para liberar portas no Firewall do Windows
# Execute como Administrador

Write-Host "🔓 Liberando portas no Firewall do Windows..." -ForegroundColor Cyan
Write-Host ""

# Verifica se está rodando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "   Clique com botão direito e selecione 'Executar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

# Portas a serem liberadas
$portas = @(3000, 5173)

foreach ($porta in $portas) {
    Write-Host "📌 Liberando porta $porta..." -ForegroundColor Yellow
    
    # Remove regra existente se houver
    Remove-NetFirewallRule -DisplayName "Todo App - Porta $porta" -ErrorAction SilentlyContinue
    
    # Adiciona nova regra
    New-NetFirewallRule -DisplayName "Todo App - Porta $porta" `
        -Direction Inbound `
        -LocalPort $porta `
        -Protocol TCP `
        -Action Allow `
        -Profile Any | Out-Null
    
    Write-Host "   ✅ Porta $porta liberada com sucesso!" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Todas as portas foram liberadas!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora você pode acessar o sistema pela rede usando:" -ForegroundColor Cyan
Write-Host "   Frontend: http://[SEU_IP]:5173" -ForegroundColor White
Write-Host "   Backend:  http://[SEU_IP]:3000" -ForegroundColor White
Write-Host ""
Write-Host "Para descobrir seu IP, execute: npm run get-ip" -ForegroundColor Yellow
Write-Host ""
pause
