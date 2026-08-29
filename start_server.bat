@echo off
title KisanSetu 24/7 Server (Unlimited Runtime)
color 0A
cls
echo ====================================================================
echo             🌾 KisanSetu - 24/7 Unlimited Server Launcher
echo ====================================================================
echo.
echo [*] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ERROR: Python is not found in PATH. Please install Python 3.10+
    pause
    exit /b 1
)

echo [*] Python detected.
echo [*] Initializing 24/7 Resilient Backend Server on port 3000...
echo.
echo Local Website & API: http://localhost:3000
echo Swagger API Docs:    http://localhost:3000/docs
echo.
echo [INFO] Server has auto-restart enabled. It will run 24/7 without stopping.
echo [INFO] Press CTRL+C at any time if you wish to stop the server manually.
echo ====================================================================
echo.

:SERVER_LOOP
python run_server.py
echo.
echo [!] Server process exited. Restarting in 2 seconds...
timeout /t 2 /nobreak >nul
goto SERVER_LOOP
