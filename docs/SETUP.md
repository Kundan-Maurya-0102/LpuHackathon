# Local Setup Instructions

Follow these steps to run the KisanSetu full-stack application on your local machine.

## Prerequisites
1. **Node.js**: v18 or higher
2. **MySQL**: v8.0 or higher
3. **data.gov.in API Key**: Required to fetch live mandi prices. Register at [data.gov.in](https://data.gov.in) to get an API key.

## 1. Database Setup
1. Log in to your local MySQL instance:
   ```bash
   mysql -u root -p
   ```
2. Create the database:
   ```sql
   CREATE DATABASE kisansetu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Run the schema and seed scripts located in the `database/` directory:
   ```bash
   mysql -u root -p kisansetu_db < database/schema.sql
   mysql -u root -p kisansetu_db < database/seeds/seed_commodities.sql
   ```

## 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your local MySQL credentials and your `DATA_GOV_IN_API_KEY`.
5. Start the development server:
   ```bash
   npm run dev
   ```
   The backend should now be running on `http://localhost:3000`.

## 3. Frontend Setup
Because the frontend is built with vanilla HTML/CSS/JS, it does not require a build step (like Webpack or Vite). 
However, it must be served over a local HTTP server (not simply opening `index.html` via `file://`) for API requests and module scripts to work correctly.

1. At the root of the repository, run a simple static file server. You can use the `serve` package:
   ```bash
   npx serve .
   ```
   Or using Python:
   ```bash
   python -m http.server 8000
   ```
2. Open your browser and navigate to the provided local URL (e.g., `http://localhost:8000`).

## 4. Testing the Application
- Open the web application and verify that you see the map and the UI loads.
- Click "Login" and "Sign up" to create a new farmer profile.
- Navigate to the Market section to see live prices. Note that the first request might take a few seconds as the backend fetches data from the government API and caches it in MySQL.
- Click the "Sell Produce" Floating Action Button to generate a digital receipt.
