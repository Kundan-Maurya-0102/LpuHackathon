# 🚜 KisanSetu (किसान सेतु)

**Empowering Indian Farmers with Live Market Data and Digital Infrastructure.**
Built for the 28 August Hackathon at LPU by Kundan, Rishi, and Akshith.

## Overview
KisanSetu is a comprehensive, full-stack platform designed specifically for Indian farmers. It bridges the information gap by providing real-time APMC Mandi prices, historical crop trends, digital sales receipts (J-Forms), and distance-based market recommendations, all wrapped in a localized, farmer-friendly interface.

## ✨ Key Features
- **Live Mandi Prices**: Real-time agricultural commodity prices fetched from `data.gov.in`.
- **Price History & Trends**: Interactive charts showing historical price movements to help farmers decide when to sell.
- **Smart Recommendations**: Suggests the most profitable nearby Mandi by calculating distance, transport costs, and current market rates.
- **Digital J-Forms (Receipts)**: Allows farmers to record their sales and generate digital, printable receipts.
- **Voice Search & Localization**: Supports Hindi and Punjabi with built-in voice search for accessibility.
- **SMS Alerts**: Farmers receive OTPs and crucial price alerts directly to their mobile phones.
- **Mobile-First Design**: Optimized for mobile devices with an intuitive bottom navigation bar.

## 🏗️ Architecture
- **Frontend**: Vanilla HTML/CSS/JavaScript (Fast, lightweight, no build step needed). Uses Leaflet.js for maps and Chart.js for data visualization.
- **Backend**: Python 3 & FastAPI REST API (`backend_python/`).
- **Database**: SQLite with dynamic initialization and caching.
- **Authentication**: Stateless JWT-based authentication with secure Bcrypt password hashing.

## 🚀 Quick Start

### 1. Start the Python Backend
```bash
cd backend_python
pip install -r requirements.txt
python run.py
```
Backend runs on `http://localhost:3000` (API Docs available at `http://localhost:3000/docs`).

### 2. Start the Frontend
Open `index.html` via a local server (e.g. VS Code Live Server, or Python HTTP server):
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your browser.

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
