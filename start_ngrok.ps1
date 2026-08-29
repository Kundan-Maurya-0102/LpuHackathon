# KisanSetu ngrok Hosting Launcher (PowerShell)
$Host.UI.RawUI.WindowTitle = "🌾 KisanSetu - ngrok Live Hosting"

Write-Host "====================================================================" -ForegroundColor Green
Write-Host "            🌾 KisanSetu - 24/7 ngrok Hosting Launcher" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Green
Write-Host ""

python host_ngrok.py
