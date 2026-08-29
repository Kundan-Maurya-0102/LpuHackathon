# Local Setup Instructions

Follow these steps to run the KisanSetu full-stack application on your local machine.

## Prerequisites
1. **Python**: v3.10 or higher
2. **data.gov.in API Key**: (Optional/Included) Required to fetch live mandi prices. Register at [data.gov.in](https://data.gov.in) to get an API key.

## 1. Running the 24/7 Unlimited Server

### Option A: 1-Click Launch (Recommended)
Double-click **`start_server.bat`** (or run `.\start_server.ps1` in PowerShell).

### Option B: Terminal Command
```bash
python run_server.py
```

The unified server automatically serves:
- 🌾 **Full Web Frontend**: `http://localhost:3000`
- ⚡ **REST APIs**: `http://localhost:3000/api`
- 📄 **Interactive Swagger Docs**: `http://localhost:3000/docs`

The server runs with **24/7 auto-recovery supervisor**, **SQLite WAL concurrency**, and **keep-alive heartbeat**, ensuring the application runs indefinitely without stopping or timing out.

## 3. Testing the Application
- Open the web application and verify that the UI and map load properly.
- Sign up or Login with a mobile number to experience the dynamic profile and personalized mandi rates.
- Navigate to the Market section to see live prices fetched from `data.gov.in` and cached in SQLite.
- Click the "Sell Produce" Floating Action Button to record a sale and generate a digital J-Form receipt.
