import sqlite3
import json
import os
import bcrypt
from datetime import datetime, timedelta
from .config import config

def get_db_connection():
    config.DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(config.DB_PATH), check_same_thread=False, timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=60000;")
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def init_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users Table (Farmer Profile Storage)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT DEFAULT 'Farmer',
        mobile TEXT NOT NULL UNIQUE,
        email TEXT,
        password_hash TEXT,
        farmer_id TEXT,
        state TEXT DEFAULT 'Punjab',
        district TEXT DEFAULT 'Kapurthala',
        village TEXT DEFAULT 'Phagwara / LPU Region',
        land_acres REAL DEFAULT 8.5,
        primary_mandi TEXT DEFAULT 'Khanna APMC Grain Market',
        preferred_vehicle TEXT DEFAULT 'Tractor Trolley (40 Qtl)',
        crops TEXT DEFAULT '["Wheat (गेहूं)", "Basmati Paddy (धान)", "Mustard (सरसों)"]',
        preferred_language TEXT DEFAULT 'hi',
        latitude REAL DEFAULT 31.2550,
        longitude REAL DEFAULT 75.7050,
        is_verified INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 2. OTP Verifications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mobile TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 3. Market Prices Table (Dynamic Real-time APMC Mandi Data)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS market_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        market TEXT NOT NULL,
        commodity TEXT NOT NULL,
        variety TEXT,
        min_price REAL NOT NULL,
        max_price REAL NOT NULL,
        modal_price REAL NOT NULL,
        arrival_date DATE NOT NULL,
        arrivals TEXT DEFAULT 'Moderate',
        unit TEXT DEFAULT 'Quintal',
        source TEXT DEFAULT 'Agmarknet / data.gov.in',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(state, district, market, commodity, variety, arrival_date)
    );
    """)
    
    # 4. Sales & J-Form Trade Receipts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        farmer_name TEXT NOT NULL,
        farmer_mobile TEXT,
        farmer_id_str TEXT,
        commodity TEXT NOT NULL,
        variety TEXT,
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'Quintal',
        price_per_unit REAL NOT NULL,
        gross_amount REAL NOT NULL,
        mandi_cess REAL DEFAULT 0,
        loading_fee REAL DEFAULT 0,
        transport_fee REAL DEFAULT 0,
        net_amount REAL NOT NULL,
        mandi_name TEXT NOT NULL,
        buyer_name TEXT,
        buyer_contact TEXT,
        status TEXT DEFAULT 'Settled',
        notes TEXT,
        receipt_id TEXT UNIQUE NOT NULL,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    """)

    # 5. Price Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS price_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        mobile TEXT NOT NULL,
        commodity TEXT NOT NULL,
        target_price REAL NOT NULL,
        condition TEXT DEFAULT 'above',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    conn.commit()
    
    # ── Schema Migrations ──
    # Safely add new columns if they don't exist (handles existing DBs)
    migrations = [
        ("market_prices", "arrivals", "TEXT DEFAULT 'Moderate'"),
        ("market_prices", "unit",     "TEXT DEFAULT 'Quintal'"),
        ("market_prices", "source",   "TEXT DEFAULT 'Agmarknet / data.gov.in'"),
        ("sales", "gross_amount",     "REAL DEFAULT 0"),
        ("sales", "total_amount",     "REAL DEFAULT 0"),
        ("sales", "farmer_name",      "TEXT DEFAULT 'Farmer'"),
        ("sales", "farmer_mobile",    "TEXT DEFAULT ''"),
        ("sales", "farmer_id_str",    "TEXT DEFAULT ''"),
        ("sales", "mandi_cess",       "REAL DEFAULT 0"),
        ("sales", "loading_fee",      "REAL DEFAULT 0"),
        ("sales", "net_amount",       "REAL DEFAULT 0"),
        ("sales", "buyer_name",       "TEXT DEFAULT ''"),
        ("sales", "buyer_contact",    "TEXT DEFAULT ''"),
        ("sales", "status",           "TEXT DEFAULT 'Settled'"),
        ("sales", "notes",            "TEXT DEFAULT ''"),
        ("users", "preferred_language", "TEXT DEFAULT 'hi'"),
        ("users", "latitude",         "REAL DEFAULT 31.2550"),
        ("users", "longitude",        "REAL DEFAULT 75.7050"),
    ]
    for table, column, col_def in migrations:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}")
            conn.commit()
            print(f"[DB Migration] Added column '{column}' to '{table}'.")
        except Exception:
            pass  # Column already exists — safe to ignore
    
    # Seed Initial Market Prices if needed
    seed_market_prices(cursor, conn)
    
    # Seed Demo Farmer User if needed
    cursor.execute("SELECT id FROM users WHERE mobile = ?", ("9876543210",))
    if not cursor.fetchone():
        hashed = hash_password("kisan123")
        cursor.execute("""
            INSERT INTO users (
                full_name, mobile, password_hash, farmer_id, 
                state, district, village, land_acres, primary_mandi,
                preferred_vehicle, crops, is_verified
            ) VALUES (
                'Gurpreet Singh', '9876543210', ?, 'PB-2026-8941',
                'Punjab', 'Ludhiana', 'Khanna Kalan', 12.0,
                'Khanna APMC Grain Market', 'Tractor Trolley (40 Qtl)',
                '["Wheat (गेहूं)", "Basmati Paddy (धान)", "Mustard (सरसों)"]', 1
            )
        """, (hashed,))
        conn.commit()

    conn.close()

def seed_market_prices(cursor, conn):
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Check if today's prices already exist
    cursor.execute("SELECT COUNT(*) FROM market_prices WHERE arrival_date = ?", (today_str,))
    count = cursor.fetchone()[0]
    
    if count < 10:
        prices_data = [
            # Khanna APMC Grain Market (Asia's Largest)
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Wheat", "FAQ HD-2967", 2430.0, 2610.0, 2510.0, today_str, "Heavy (3,400 Qtl)"),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Basmati Paddy", "Pusa 1121", 3800.0, 4200.0, 4080.0, today_str, "Moderate (1,850 Qtl)"),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Mustard", "Black Bold", 5350.0, 5620.0, 5490.0, today_str, "Low (420 Qtl)"),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Potato", "Kufri Jyoti", 1380.0, 1520.0, 1450.0, today_str, "High (2,100 Qtl)"),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Onion", "Red Medium", 2600.0, 2950.0, 2790.0, today_str, "Moderate (850 Qtl)"),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Cotton", "BT Cotton", 7200.0, 7490.0, 7350.0, today_str, "Moderate (620 Qtl)"),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Maize", "Yellow Hybrid", 2150.0, 2340.0, 2260.0, today_str, "High (1,400 Qtl)"),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Chana", "Desi Bold", 5800.0, 6150.0, 5980.0, today_str, "Low (310 Qtl)"),
            
            # Phagwara Mandi (Near LPU / Kapurthala)
            ("Punjab", "Kapurthala", "Phagwara APMC Grain Market", "Wheat", "FAQ HD-2967", 2390.0, 2570.0, 2480.0, today_str, "Moderate (1,200 Qtl)"),
            ("Punjab", "Kapurthala", "Phagwara APMC Grain Market", "Basmati Paddy", "Pusa 1509", 3740.0, 4120.0, 3980.0, today_str, "Moderate (950 Qtl)"),
            ("Punjab", "Kapurthala", "Phagwara APMC Grain Market", "Mustard", "Black Bold", 5290.0, 5560.0, 5440.0, today_str, "Low (280 Qtl)"),
            ("Punjab", "Kapurthala", "Phagwara APMC Grain Market", "Potato", "Pukhraj", 1360.0, 1500.0, 1430.0, today_str, "Heavy (3,800 Qtl)"),
            ("Punjab", "Kapurthala", "Phagwara APMC Grain Market", "Onion", "Red Medium", 2560.0, 2910.0, 2740.0, today_str, "Moderate (600 Qtl)"),
            ("Punjab", "Kapurthala", "Phagwara APMC Grain Market", "Cotton", "Medium Staple", 7120.0, 7440.0, 7290.0, today_str, "Low (180 Qtl)"),
            ("Punjab", "Kapurthala", "Phagwara APMC Grain Market", "Maize", "Yellow Hybrid", 2120.0, 2310.0, 2230.0, today_str, "Moderate (800 Qtl)"),
            ("Punjab", "Kapurthala", "Phagwara APMC Grain Market", "Chana", "Desi Bold", 5750.0, 6100.0, 5920.0, today_str, "Low (190 Qtl)"),

            # Jalandhar City Mandi
            ("Punjab", "Jalandhar", "Jalandhar City Mandi", "Wheat", "FAQ Sharbati", 2420.0, 2590.0, 2500.0, today_str, "Moderate (1,900 Qtl)"),
            ("Punjab", "Jalandhar", "Jalandhar City Mandi", "Basmati Paddy", "Pusa 1121", 3780.0, 4170.0, 4030.0, today_str, "Moderate (1,100 Qtl)"),
            ("Punjab", "Jalandhar", "Jalandhar City Mandi", "Mustard", "Black Bold", 5320.0, 5590.0, 5470.0, today_str, "Low (350 Qtl)"),
            ("Punjab", "Jalandhar", "Jalandhar City Mandi", "Potato", "Kufri Jyoti", 1380.0, 1520.0, 1450.0, today_str, "Heavy (4,200 Qtl)"),
            ("Punjab", "Jalandhar", "Jalandhar City Mandi", "Onion", "Nasik Red", 2590.0, 2940.0, 2780.0, today_str, "High (1,600 Qtl)"),
            ("Punjab", "Jalandhar", "Jalandhar City Mandi", "Cotton", "BT Cotton", 7160.0, 7470.0, 7320.0, today_str, "Low (210 Qtl)"),
            ("Punjab", "Jalandhar", "Jalandhar City Mandi", "Maize", "Yellow Hybrid", 2140.0, 2330.0, 2250.0, today_str, "Moderate (750 Qtl)"),
            ("Punjab", "Jalandhar", "Jalandhar City Mandi", "Chana", "Desi Bold", 5780.0, 6120.0, 5950.0, today_str, "Low (260 Qtl)"),

            # Ludhiana APMC Fruit & Grain Mandi
            ("Punjab", "Ludhiana", "Ludhiana APMC Fruit & Grain", "Wheat", "FAQ Sharbati", 2450.0, 2630.0, 2540.0, today_str, "Heavy (2,800 Qtl)"),
            ("Punjab", "Ludhiana", "Ludhiana APMC Fruit & Grain", "Basmati Paddy", "Pusa 1121", 3830.0, 4230.0, 4110.0, today_str, "Moderate (1,400 Qtl)"),
            ("Punjab", "Ludhiana", "Ludhiana APMC Fruit & Grain", "Mustard", "Black Bold", 5370.0, 5640.0, 5510.0, today_str, "Low (480 Qtl)"),
            ("Punjab", "Ludhiana", "Ludhiana APMC Fruit & Grain", "Potato", "Kufri Jyoti", 1390.0, 1540.0, 1470.0, today_str, "High (3,100 Qtl)"),
            ("Punjab", "Ludhiana", "Ludhiana APMC Fruit & Grain", "Onion", "Red Medium", 2630.0, 2980.0, 2820.0, today_str, "Heavy (2,400 Qtl)"),
            ("Punjab", "Ludhiana", "Ludhiana APMC Fruit & Grain", "Cotton", "Medium Staple", 7230.0, 7520.0, 7380.0, today_str, "Moderate (550 Qtl)"),
            ("Punjab", "Ludhiana", "Ludhiana APMC Fruit & Grain", "Maize", "Yellow Hybrid", 2160.0, 2350.0, 2270.0, today_str, "High (1,100 Qtl)"),
            ("Punjab", "Ludhiana", "Ludhiana APMC Fruit & Grain", "Chana", "Desi Bold", 5820.0, 6160.0, 6000.0, today_str, "Moderate (420 Qtl)"),

            # Amritsar Bhagtanwala Mandi
            ("Punjab", "Amritsar", "Amritsar Bhagtanwala Mandi", "Wheat", "FAQ HD-2967", 2430.0, 2600.0, 2515.0, today_str, "Heavy (2,500 Qtl)"),
            ("Punjab", "Amritsar", "Amritsar Bhagtanwala Mandi", "Basmati Paddy", "Pusa 1121 Premium", 3850.0, 4250.0, 4120.0, today_str, "Heavy (3,600 Qtl)"),
            ("Punjab", "Amritsar", "Amritsar Bhagtanwala Mandi", "Mustard", "Black Bold", 5300.0, 5570.0, 5450.0, today_str, "Low (310 Qtl)"),
            ("Punjab", "Amritsar", "Amritsar Bhagtanwala Mandi", "Potato", "Pukhraj", 1365.0, 1510.0, 1440.0, today_str, "High (2,200 Qtl)"),
            ("Punjab", "Amritsar", "Amritsar Bhagtanwala Mandi", "Onion", "Red Medium", 2570.0, 2920.0, 2750.0, today_str, "Moderate (900 Qtl)"),
            ("Punjab", "Amritsar", "Amritsar Bhagtanwala Mandi", "Cotton", "Medium Staple", 7130.0, 7440.0, 7300.0, today_str, "Low (200 Qtl)"),
            ("Punjab", "Amritsar", "Amritsar Bhagtanwala Mandi", "Maize", "Yellow Hybrid", 2130.0, 2320.0, 2240.0, today_str, "Moderate (650 Qtl)"),
            ("Punjab", "Amritsar", "Amritsar Bhagtanwala Mandi", "Chana", "Desi Bold", 5760.0, 6110.0, 5940.0, today_str, "Low (220 Qtl)")
        ]
        
        cursor.executemany("""
            INSERT OR REPLACE INTO market_prices (
                state, district, market, commodity, variety,
                min_price, max_price, modal_price, arrival_date, arrivals
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, prices_data)
        conn.commit()
