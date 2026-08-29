# 🚜 KisanSetu (किसान सेतु)

**Empowering Indian Farmers with Live Market Data and Digital Infrastructure.**
Built for the 28 August Hackathon at LPU by Kundan, Rishi, and Akshith.

## Overview
KisanSetu is a comprehensive, full-stack platform designed specifically for Indian farmers. It bridges the information gap by providing real-time APMC Mandi prices, historical crop trends, digital sales receipts (J-Forms), and distance-based market recommendations, all wrapped in a localized, farmer-friendly interface.

## Key Features
- **Live Mandi Rates**: Real-time daily prices and market arrivals synced with official e-NAM / Agmarknet datasets.
- **AI Max Profit Discovery**: Evaluates price differentials vs. actual road distance and fuel costs to recommend the most profitable mandi.
- **Smart Transport & Profit Calculator**: Estimates net take-home earnings by factoring in crop volume, vehicle mileage (tractor, pickup, truck), and 1.5% APMC market cess.
- **Digital J-Form Receipts**: Instant generation of certified e-NAM sales receipts with verifiable QR codes for bank loans and crop insurance.
- **GPS Navigation & Radar Map**: Interactive mandi map showing distance, driving duration, and 1-click Google Maps turn-by-turn directions.
- **8 Indian Languages & Voice AI**: Instant localization across Hindi, Punjabi, English, Marathi, Gujarati, Telugu, Tamil, and Bengali with Web Speech voice search and audio read-aloud.
- **Free Price Alerts**: Custom WhatsApp and SMS notifications when market rates reach the farmer's target price.
- **Onboarding Feature Guide**: Step-by-step interactive walkthrough with audio read-aloud for new farmers.

## Tech Stack
- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom design system, Glassmorphism, Dark/Light modes), and Vanilla JavaScript (ES6+). Zero build tools or heavy framework overhead for maximum performance on low-end mobile devices.
- **Backend**: Python 3.10+, FastAPI, SQLite with SQLAlchemy ORM, and Pydantic validation.
- **APIs & Tools**: Web Speech API (SpeechRecognition & SpeechSynthesis), HTML5 Geolocation, Leaflet.js, and Chart.js.

## 🚀 Quick Start

### 1. Local 24/7 Server
- **1-Click**: Double-click `start_server.bat` (or run `.\start_server.ps1`)
- **Or Terminal**: `python run_server.py`
- 🌐 **Local Website**: `http://localhost:3000`
- 📖 **API Docs**: `http://localhost:3000/docs`

### 2. Host Online with ngrok (Public Mobile Access)
- **1-Click**: Double-click `start_ngrok.bat` (or run `.\start_ngrok.ps1`)
- **Or Terminal**: `python host_ngrok.py` (or `ngrok http 3000`)
- 📱 It generates a public HTTPS link (e.g. `https://xxxx.ngrok-free.app`) to open the app on any smartphone or share with judges.

## 📚 Documentation
For detailed technical documentation, please refer to the `docs/` directory:
- [SETUP.md](./docs/SETUP.md): Instructions to run the project locally.
- [API.md](./docs/API.md): Comprehensive documentation of backend API endpoints.
- [DATABASE.md](./docs/DATABASE.md): Schema definitions and database architecture.

## 🤝 Team
- Kundan
- Rishi
- Akshith

---
*Dedicated to the hardworking farmers of India. जय जवान, जय किसान।*
