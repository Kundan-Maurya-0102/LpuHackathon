import json
import jwt
from datetime import datetime, timedelta
from typing import Optional, List, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from ..config import config
from ..database import get_db_connection, hash_password, verify_password
from ..services.sms_service import sms_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ── Pydantic Request Models ──
class SendOtpRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=15)

class VerifyOtpLoginRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=4, max_length=10)
    full_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    land_acres: Optional[float] = None
    primary_mandi: Optional[str] = None
    preferred_vehicle: Optional[str] = None

class SignupRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=15)
    farmer_id: Optional[str] = None
    otp: str = Field(..., min_length=4, max_length=10)
    full_name: Optional[str] = "Farmer"
    state: Optional[str] = "Punjab"
    district: Optional[str] = "Kapurthala"
    village: Optional[str] = "Phagwara"
    land_acres: Optional[float] = 8.5
    primary_mandi: Optional[str] = "Khanna APMC Grain Market"
    preferred_vehicle: Optional[str] = "Tractor Trolley (40 Qtl)"
    crops: Optional[Any] = None
    password: Optional[str] = None

class LoginRequest(BaseModel):
    mobile: str
    password: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    land_acres: Optional[float] = None
    primary_mandi: Optional[str] = None
    preferred_vehicle: Optional[str] = None
    crops: Optional[Any] = None
    preferred_language: Optional[str] = None

# ── Helper for JWT generation ──
def create_jwt_token(user_id: int, mobile: str) -> str:
    payload = {
        "id": user_id,
        "mobile": mobile,
        "exp": datetime.utcnow() + timedelta(days=config.JWT_EXPIRES_DAYS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)

def sanitize_user(user_dict: dict) -> dict:
    if not user_dict:
        return {}
    user = dict(user_dict)
    user.pop("password_hash", None)
    
    # Parse crops if JSON string
    if isinstance(user.get("crops"), str):
        try:
            user["crops"] = json.loads(user["crops"])
        except Exception:
            user["crops"] = [c.strip() for c in user["crops"].split(",") if c.strip()]
    elif not user.get("crops"):
        user["crops"] = ["Wheat (गेहूं)", "Basmati Paddy (धान)", "Mustard (सरसों)"]
        
    return user

# ── Dependency for Auth ──
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        user_id = payload.get("id")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User account not found")
        
        return sanitize_user(dict(user))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired, please log in again")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Endpoints ──

@router.post("/send-otp")
def send_otp(body: SendOtpRequest):
    result = sms_service.send_otp(body.mobile)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to send OTP"))
    return result

@router.post("/verify-login-otp")
def verify_login_otp(body: VerifyOtpLoginRequest):
    clean_mobile = sms_service.normalize_mobile(body.mobile)
    
    # 1. Verify OTP in database
    is_valid = sms_service.verify_otp(clean_mobile, body.otp)
    if not is_valid:
        raise HTTPException(
            status_code=400, 
            detail="Invalid or expired OTP. Please check the 6-digit code or request a new one."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 2. Look up user by mobile
    cursor.execute("SELECT * FROM users WHERE mobile = ?", (clean_mobile,))
    existing_user = cursor.fetchone()
    
    if existing_user:
        user_dict = sanitize_user(dict(existing_user))
        token = create_jwt_token(user_dict["id"], clean_mobile)
        conn.close()
        return {
            "success": True,
            "message": f"Welcome back, {user_dict.get('full_name', 'Farmer')}!",
            "is_new_user": False,
            "data": {
                "token": token,
                "user": user_dict
            }
        }
    
    # 3. New User Auto-Onboarding
    farmer_id = f"PB-2026-{datetime.now().strftime('%M%S')}"
    full_name = body.full_name or f"Farmer {clean_mobile[-4:]}"
    state = body.state or "Punjab"
    district = body.district or "Kapurthala"
    village = body.village or "Phagwara / LPU Region"
    land_acres = body.land_acres if body.land_acres is not None else 8.5
    primary_mandi = body.primary_mandi or "Khanna APMC Grain Market"
    preferred_vehicle = body.preferred_vehicle or "Tractor Trolley (40 Qtl)"
    crops_json = json.dumps(["Wheat (गेहूं)", "Basmati Paddy (धान)", "Mustard (सरसों)"])

    cursor.execute("""
        INSERT INTO users (
            full_name, mobile, farmer_id, state, 
            district, village, land_acres, primary_mandi,
            preferred_vehicle, crops, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        full_name, clean_mobile, farmer_id, state, 
        district, village, land_acres, primary_mandi,
        preferred_vehicle, crops_json
    ))
    conn.commit()
    new_user_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (new_user_id,))
    new_user = sanitize_user(dict(cursor.fetchone()))
    conn.close()

    token = create_jwt_token(new_user_id, clean_mobile)
    return {
        "success": True,
        "message": f"Welcome {new_user.get('full_name')}! Profile created and verified successfully.",
        "is_new_user": True,
        "data": {
            "token": token,
            "user": new_user
        }
    }

@router.post("/signup")
def signup(body: SignupRequest):
    clean_mobile = sms_service.normalize_mobile(body.mobile)
    
    # 1. Verify OTP in database
    is_valid = sms_service.verify_otp(clean_mobile, body.otp)
    if not is_valid:
        raise HTTPException(
            status_code=400, 
            detail="Invalid or expired OTP. Please enter the dynamic 6-digit code sent to your phone."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 2. Check if user already exists
    cursor.execute("SELECT * FROM users WHERE mobile = ?", (clean_mobile,))
    existing_user = cursor.fetchone()
    
    if existing_user:
        user_dict = sanitize_user(dict(existing_user))
        token = create_jwt_token(user_dict["id"], clean_mobile)
        conn.close()
        return {
            "success": True,
            "message": "Welcome back! Logged in successfully",
            "data": {
                "token": token,
                "user": user_dict
            }
        }
        
    # 3. Create new user
    pwd_hash = hash_password(body.password) if body.password else None
    farmer_id = body.farmer_id or f"PB-2026-{datetime.now().strftime('%M%S')}"
    crops_json = json.dumps(body.crops) if isinstance(body.crops, list) else json.dumps(["Wheat (गेहूं)", "Basmati Paddy (धान)", "Mustard (सरसों)"])

    cursor.execute("""
        INSERT INTO users (
            full_name, mobile, password_hash, farmer_id, state, 
            district, village, land_acres, primary_mandi,
            preferred_vehicle, crops, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        body.full_name or "Farmer",
        clean_mobile,
        pwd_hash,
        farmer_id,
        body.state or "Punjab",
        body.district or "Kapurthala",
        body.village or "Phagwara",
        body.land_acres or 8.5,
        body.primary_mandi or "Khanna APMC Grain Market",
        body.preferred_vehicle or "Tractor Trolley (40 Qtl)",
        crops_json
    ))
    conn.commit()
    new_user_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (new_user_id,))
    new_user = sanitize_user(dict(cursor.fetchone()))
    conn.close()

    token = create_jwt_token(new_user_id, clean_mobile)
    return {
        "success": True,
        "message": f"Welcome {new_user.get('full_name')}! Account registered successfully.",
        "data": {
            "token": token,
            "user": new_user
        }
    }

@router.post("/login")
def login(body: LoginRequest):
    clean_mobile = sms_service.normalize_mobile(body.mobile)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE mobile = ?", (clean_mobile,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(
            status_code=401, 
            detail="Account not found with this mobile number. Please log in with OTP to auto-register."
        )

    user_raw = dict(user)
    stored_hash = user_raw.get("password_hash")
    
    # If user has password set, verify it
    if stored_hash and body.password:
        if not verify_password(body.password, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid password entered. Please try again or use OTP.")
            
    user_dict = sanitize_user(user_raw)
    token = create_jwt_token(user_dict["id"], clean_mobile)
    
    return {
        "success": True,
        "message": f"Welcome back, {user_dict.get('full_name', 'Farmer')}!",
        "data": {
            "token": token,
            "user": user_dict
        }
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": current_user
    }

@router.put("/profile")
def update_profile(body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    crops_json = json.dumps(body.crops) if isinstance(body.crops, list) else None
    
    cursor.execute("""
        UPDATE users SET
            full_name = COALESCE(?, full_name),
            state = COALESCE(?, state),
            district = COALESCE(?, district),
            village = COALESCE(?, village),
            land_acres = COALESCE(?, land_acres),
            primary_mandi = COALESCE(?, primary_mandi),
            preferred_vehicle = COALESCE(?, preferred_vehicle),
            crops = COALESCE(?, crops),
            preferred_language = COALESCE(?, preferred_language),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        body.full_name,
        body.state,
        body.district,
        body.village,
        body.land_acres,
        body.primary_mandi,
        body.preferred_vehicle,
        crops_json,
        body.preferred_language,
        current_user["id"]
    ))
    conn.commit()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],))
    updated_user = sanitize_user(dict(cursor.fetchone()))
    conn.close()
    
    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": updated_user
    }
