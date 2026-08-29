import sqlite3
import json
import os
import bcrypt
from datetime import datetime, timedelta
from .config import config

def get_db_connection():
    config.DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(config.DB_PATH), check_same_thread=False)
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
    
    # 1. Users Table (Dynamic Farmer Profile & Authentication)
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
    
    # Migrate any missing columns if table already existed
    existing_cols = [c[1] for c in cursor.execute("PRAGMA table_info(users)").fetchall()]
    if "primary_mandi" not in existing_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN primary_mandi TEXT DEFAULT 'Khanna APMC Grain Market'")
    if "preferred_vehicle" not in existing_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN preferred_vehicle TEXT DEFAULT 'Tractor Trolley (40 Qtl)'")
    if "crops" not in existing_cols:
        cursor.execute('ALTER TABLE users ADD COLUMN crops TEXT DEFAULT \'["Wheat (गेहूं)", "Basmati Paddy (धान)", "Mustard (सरसों)"]\'')

    # 2. OTP Verifications Table (Real-time dynamic OTP with attempt tracker & 10min expiry)
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
    
    # 3. Market Prices Table
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
        unit TEXT DEFAULT 'Quintal',
        source TEXT DEFAULT 'data.gov.in',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(state, district, market, commodity, variety, arrival_date)
    );
    """)
    
    # 4. Sales & J-Form Receipts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        commodity TEXT NOT NULL,
        variety TEXT,
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'Quintal',
        price_per_unit REAL NOT NULL,
        total_amount REAL NOT NULL,
        mandi_name TEXT,
        buyer_name TEXT,
        buyer_contact TEXT,
        notes TEXT,
        receipt_id TEXT UNIQUE NOT NULL,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 5. Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    conn.commit()
    
    # Pre-seed Demo Farmer User (1234567895 / kisan123)
    cursor.execute("SELECT id FROM users WHERE mobile = ?", ("1234567895",))
    demo_user = cursor.fetchone()
    if not demo_user:
        hashed = hash_password("kisan123")
        cursor.execute("""
            INSERT INTO users (
                id, full_name, mobile, password_hash, farmer_id, 
                state, district, village, land_acres, primary_mandi,
                preferred_vehicle, crops, is_verified
            ) VALUES (
                1, 'Ramesh Kumar (Demo Farmer)', '1234567895', ?, 'PB-2026-8941',
                'Punjab', 'Kapurthala', 'Phagwara / LPU Region', 8.5,
                'Khanna APMC Grain Market', 'Tractor Trolley (40 Qtl)',
                '["Wheat (गेहूं)", "Basmati Paddy (धान)", "Potato (आलू)"]', 1
            )
        """, (hashed,))
        conn.commit()

    # Pre-seed Initial Market Prices if table is empty
    cursor.execute("SELECT COUNT(*) FROM market_prices")
    price_count = cursor.fetchone()[0]
    
    if price_count == 0:
        today_str = datetime.now().strftime("%Y-%m-%d")
        sample_records = [
            # Khanna Mandi
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Wheat", "FAQ HD-2967", 2430.0, 2610.0, 2510.0, today_str),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Basmati Paddy", "Pusa 1121", 3800.0, 4200.0, 4080.0, today_str),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Mustard", "Black Bold", 5350.0, 5620.0, 5490.0, today_str),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Potato", "Kufri Jyoti", 1380.0, 1520.0, 1450.0, today_str),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Onion", "Red Medium", 2600.0, 2950.0, 2790.0, today_str),
            ("Punjab", "Ludhiana", "Khanna APMC Grain Market", "Cotton", "Medium Staple", 7200.0, 7490.0, 7350.0, today_str),
            
            # Phagwara Mandi
            ("Punjab", "Kapurthala", "Phagwara Mandi", "Wheat", "FAQ HD-2967", 2380.0, 2560.0, 2470.0, today_str),
            ("Punjab", "Kapurthala", "Phagwara Mandi", "Basmati Paddy", "Pusa 1509", 3720.0, 4100.0, 3960.0, today_str),
            ("Punjab", "Kapurthala", "Phagwara Mandi", "Mustard", "Black Bold", 5280.0, 5550.0, 5430.0, today_str),
            ("Punjab", "Kapurthala", "Phagwara Mandi", "Potato", "Pukhraj", 1350.0, 1500.0, 1430.0, today_str),
            ("Punjab", "Kapurthala", "Phagwara Mandi", "Onion", "Red Medium", 2550.0, 2900.0, 2730.0, today_str),
            ("Punjab", "Kapurthala", "Phagwara Mandi", "Cotton", "Medium Staple", 7100.0, 7420.0, 7280.0, today_str),

            # Jalandhar Mandi
            ("Punjab", "Jalandhar", "Jalandhar Mandi", "Wheat", "FAQ HD-2967", 2410.0, 2580.0, 2490.0, today_str),
            ("Punjab", "Jalandhar", "Jalandhar Mandi", "Basmati Paddy", "Pusa 1121", 3760.0, 4150.0, 4010.0, today_str),
            ("Punjab", "Jalandhar", "Jalandhar Mandi", "Mustard", "Black Bold", 5310.0, 5570.0, 5490.0, today_str),
            ("Punjab", "Jalandhar", "Jalandhar Mandi", "Potato", "Kufri Jyoti", 1370.0, 1510.0, 1440.0, today_str),
            ("Punjab", "Jalandhar", "Jalandhar Mandi", "Onion", "Nasik Red", 2580.0, 2920.0, 2760.0, today_str),
            ("Punjab", "Jalandhar", "Jalandhar Mandi", "Cotton", "BT Cotton", 7150.0, 7460.0, 7310.0, today_str),

            # Ludhiana Mandi
            ("Punjab", "Ludhiana", "Ludhiana Mandi", "Wheat", "FAQ Sharbati", 2440.0, 2620.0, 2530.0, today_str),
            ("Punjab", "Ludhiana", "Ludhiana Mandi", "Basmati Paddy", "Pusa 1121", 3820.0, 4220.0, 4100.0, today_str),
            ("Punjab", "Ludhiana", "Ludhiana Mandi", "Mustard", "Black Bold", 5360.0, 5630.0, 5500.0, today_str),
            ("Punjab", "Ludhiana", "Ludhiana Mandi", "Potato", "Kufri Jyoti", 1390.0, 1530.0, 1460.0, today_str),
            ("Punjab", "Ludhiana", "Ludhiana Mandi", "Onion", "Red Medium", 2620.0, 2970.0, 2810.0, today_str),
            ("Punjab", "Ludhiana", "Ludhiana Mandi", "Cotton", "Medium Staple", 7220.0, 7510.0, 7370.0, today_str),

            # Amritsar Mandi
            ("Punjab", "Amritsar", "Amritsar Mandi", "Wheat", "FAQ HD-2967", 2420.0, 2590.0, 2500.0, today_str),
            ("Punjab", "Amritsar", "Amritsar Mandi", "Basmati Paddy", "Pusa 1121", 3840.0, 4230.0, 4080.0, today_str),
            ("Punjab", "Amritsar", "Amritsar Mandi", "Mustard", "Black Bold", 5290.0, 5560.0, 5440.0, today_str),
            ("Punjab", "Amritsar", "Amritsar Mandi", "Potato", "Pukhraj", 1360.0, 1505.0, 1435.0, today_str),
            ("Punjab", "Amritsar", "Amritsar Mandi", "Onion", "Red Medium", 2560.0, 2910.0, 2740.0, today_str),
            ("Punjab", "Amritsar", "Amritsar Mandi", "Cotton", "Medium Staple", 7110.0, 7430.0, 7290.0, today_str)
        ]
        
        cursor.executemany("""
            INSERT OR IGNORE INTO market_prices (
                state, district, market, commodity, variety,
                min_price, max_price, modal_price, arrival_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_records)
        conn.commit()

    conn.close()
