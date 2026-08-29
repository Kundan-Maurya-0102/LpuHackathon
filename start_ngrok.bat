@echo off
title KisanSetu - ngrok Live Hosting
color 0B
cls
echo ====================================================================
echo             🌾 KisanSetu - 24/7 ngrok Hosting Launcher
echo ====================================================================
echo.

python host_ngrok.py
if %errorlevel% neq 0 (
    echo.
    echo [*] Direct ngrok command:
    ngrok http 3000
)

pause
