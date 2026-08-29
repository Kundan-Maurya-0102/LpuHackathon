<<<<<<< HEAD
# LpuHackathon
28 august hackthon in lpu kundan,rishi,akshith
https://kundan-maurya-0102.github.io/LpuHackathon/

## Connect Daily Market API

The provided data.gov.in resource is configured in `server.js`, and the frontend calls the local proxy through `js/api.js`.

```js
const KISANSETU_API_URL = "http://localhost:3001/api/daily-prices";
```

Put your key in `.env` as `DATA_GOV_API_KEY=...`, then run `node server.js`. Open the site through `http://localhost:3001`, not by double-clicking `index.html`. If using GitHub Pages, run the proxy locally and the frontend will call `http://localhost:3001`. The browser sends state and district filters after Farmer ID and mobile OTP login; the proxy adds the private key and calls data.gov.in.

### OTP authentication

For initial testing, set this in `.env`:

```env
INITIAL_OTP=123456
```

The user enters `123456`; the code is never displayed by the website. For real mobile delivery, leave `INITIAL_OTP` empty and configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_PHONE`. Then restart `node server.js`. OTPs expire after five minutes and are verified on the server.

Each record should contain crop and mandi names plus prices. These aliases are accepted:

```json
{
	"crop": "Wheat",
	"mandi": "Khanna APMC",
	"state": "Punjab",
	"district": "Ludhiana",
	"lat": 30.7068,
	"lng": 76.2163,
	"min_price": "2420",
	"modal_price": "2510",
	"max_price": "2580",
	"arrivals": "4,200 Qtl"
}
```

The app calculates nearest-market distance from the farmer coordinates, ranks markets by estimated net value after transport, loads map markers and routes from the API response, and shows an error/retry state when live data is unavailable. Real OTP delivery still requires connecting `sendOtpBtn` to an SMS provider/backend; the current browser demo generates the OTP locally.
=======
# 🚜 KisanSetu (किसान सेतु)

**Empowering Indian Farmers with Live Market Data and Digital Infrastructure.**
Built for the 28 August Hackathon at LPU by Kundan, Rishi, and Akshith.

![KisanSetu Hero](./images/logo.png) <!-- Add your logo here -->

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
KisanSetu has been upgraded from a static frontend prototype to a robust full-stack application:
- **Frontend**: Vanilla HTML/CSS/JavaScript (No complex frameworks, ensuring extremely fast load times on slow rural networks). Uses Leaflet.js for maps and Chart.js for data visualization.
- **Backend**: Node.js & Express.js REST API.
- **Database**: MySQL database using `mysql2/promise` for robust data integrity and transactions.
- **Authentication**: Stateless JWT-based authentication with secure Bcrypt password hashing.

## 📚 Documentation
For detailed technical documentation, please refer to the `docs/` directory:
- [SETUP.md](./docs/SETUP.md): Instructions to run the project locally.
- [API.md](./docs/API.md): Comprehensive documentation of backend API endpoints.
- [DATABASE.md](./docs/DATABASE.md): Schema definitions and ERD details.

## 🚀 Live Demo
[Original Prototype Link](https://kundan-maurya-0102.github.io/LpuHackathon/)

## 🤝 Team
- Kundan
- Rishi
- Akshith

---
*Dedicated to the hardworking farmers of India. जय जवान, जय किसान।*
>>>>>>> a8ce17e9aed00d288924b2176c7fa236e7c96ab5
