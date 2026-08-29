# KisanSetu 24/7 Resilient Server Launcher (PowerShell)
$Host.UI.RawUI.WindowTitle = "🌾 KisanSetu 24/7 Unlimited Server"

Write-Host "====================================================================" -ForegroundColor Green
Write-Host "            🌾 KisanSetu - 24/7 Unlimited Server Launcher" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Checking Python environment..." -ForegroundColor Cyan

try {
    $pythonVersion = python --version 2>&1
    Write-Host "[*] Detected: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[!] ERROR: Python is not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

Write-Host "[*] Launching 24/7 FastAPI Backend on http://localhost:3000..." -ForegroundColor Cyan
Write-Host "[*] Auto-Recovery: ACTIVE (Infinite 24/7 Uptime)" -ForegroundColor Green
Write-Host ""

while ($true) {
    try {
        python run_server.py
    } catch {
        Write-Host "[!] Encountered error: $_" -ForegroundColor Red
    }
    Write-Host "[*] Server process stopped. Auto-restarting in 2 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}
