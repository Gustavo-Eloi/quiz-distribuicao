# Rode este arquivo como Administrador (botão direito → Executar com PowerShell)
# Libera a porta 8501 para o celular na mesma rede Wi‑Fi.

$ErrorActionPreference = "Stop"
$port = 8501
$name = "Quiz Distribuicao Streamlit"

$existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Regra ja existe: $name" -ForegroundColor Green
} else {
    New-NetFirewallRule -DisplayName $name `
        -Direction Inbound -Protocol TCP -LocalPort $port `
        -Action Allow -Profile Any | Out-Null
    Write-Host "OK: porta $port liberada no Firewall." -ForegroundColor Green
}

Write-Host ""
Write-Host "No celular (mesmo Wi-Fi), abra:"
Write-Host "  http://192.168.15.5:$port" -ForegroundColor Cyan
Write-Host ""
Pause
