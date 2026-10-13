# Quiz Distribuição — Plano B (notebook + QR Code na mesma rede Wi‑Fi)
# Uso: powershell -ExecutionPolicy Bypass -File .\iniciar-evento.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Port = 8501

Write-Host ""
Write-Host "=== Quiz Distribuição — modo evento (Wi-Fi local) ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checando Python/dependencias..." -ForegroundColor Yellow
python -m pip install -q -r requirements.txt

Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

try {
    $rule = Get-NetFirewallRule -DisplayName "Quiz Distribuicao Streamlit" -ErrorAction SilentlyContinue
    if (-not $rule) {
        New-NetFirewallRule -DisplayName "Quiz Distribuicao Streamlit" `
            -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Any | Out-Null
        Write-Host "Regra de firewall criada para a porta $Port." -ForegroundColor Green
    }
} catch {
    Write-Host "Dica: se o celular nao conectar, rode este script como Administrador." -ForegroundColor Yellow
}

$ip = $null
$candidates = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceAlias -notmatch "vEthernet|Loopback|WSL|Bluetooth"
}
# Prefere Wi-Fi / Ethernet com 192.168
$ip = ($candidates | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress
if (-not $ip) {
    $ip = ($candidates | Select-Object -First 1).IPAddress
}
if (-not $ip) { $ip = "SEU-IP" }

$publicUrl = "http://${ip}:${Port}"

Write-Host ""
Write-Host "LINK PARA OS CELULARES / QR CODE:" -ForegroundColor Green
Write-Host "  $publicUrl" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  1. Notebook e celulares no MESMO Wi-Fi"
Write-Host "  2. Deixe ESTA janela aberta durante o evento"
Write-Host "  3. Apresentador: Controlar o jogo | senha: bayer2026"
Write-Host "  4. Abra o link no notebook e use o QR da tela do apresentador"
Write-Host ""

Start-Process "http://127.0.0.1:${Port}"

python -m streamlit run app.py `
    --server.headless true `
    --server.port $Port `
    --server.address 0.0.0.0
