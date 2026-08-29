import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    PORT: int = int(os.getenv("PORT", "3000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_hackathon_2026")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_DAYS: int = 7
    
    # Database (SQLite database file stored in backend_python/data/kisansetu.db)
    DB_DIR = BASE_DIR / "data"
    DB_PATH = DB_DIR / "kisansetu.db"
    
    # Real-time API
    DATA_GOV_API_KEY: str = os.getenv(
        "DATA_GOV_API_KEY", 
        "579b464db66ec23bdd000001da37490b38be4b3f787a986d952c045a"
    )
    DATA_GOV_RESOURCE_URL: str = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    
    # SMS Service
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "mock")

config = Config()
