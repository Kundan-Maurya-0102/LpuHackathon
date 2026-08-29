# Local Setup Instructions

Follow these steps to run the KisanSetu full-stack application on your local machine.

## Prerequisites
1. **Python**: v3.10 or higher
2. **data.gov.in API Key**: (Optional/Included) Required to fetch live mandi prices. Register at [data.gov.in](https://data.gov.in) to get an API key.

## 1. Backend Setup
1. Navigate to the `backend_python/` directory:
   ```bash
   cd backend_python
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. (Optional) Check `.env` settings or create one from `.env.example`:
   ```bash
   # A default working API key and SQLite configuration are already bundled
   ```
4. Start the FastAPI backend:
   ```bash
   python run.py
   ```
   The backend will auto-initialize the SQLite database and start listening on `http://localhost:3000`.
   Interactive Swagger documentation is available at `http://localhost:3000/docs`.

## 2. Frontend Setup
Because the frontend is built with vanilla HTML/CSS/JS, it does not require a build step. 
Serve the repository root using any static HTTP server:

```bash
# Using Python
python -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000`.

## 3. Testing the Application
- Open the web application and verify that the UI and map load properly.
- Sign up or Login with a mobile number to experience the dynamic profile and personalized mandi rates.
- Navigate to the Market section to see live prices fetched from `data.gov.in` and cached in SQLite.
- Click the "Sell Produce" Floating Action Button to record a sale and generate a digital J-Form receipt.
