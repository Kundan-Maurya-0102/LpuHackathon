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
