import secrets
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from ..database import get_db_connection
from .auth import get_current_user

router = APIRouter(prefix="/api/sales", tags=["Sales & J-Form Receipts"])

class CreateSaleRequest(BaseModel):
    commodity: str = Field(..., min_length=1)
    variety: Optional[str] = None
    quantity: float = Field(..., gt=0)
    unit: Optional[str] = "Quintal"
    price_per_unit: float = Field(..., gt=0)
    mandi_name: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_contact: Optional[str] = None
    notes: Optional[str] = None

@router.post("")
@router.post("/")
def create_sale(body: CreateSaleRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    gross_amount = round(body.quantity * body.price_per_unit, 2)
    
    # Apply standard APMC mandi cess (1.5%) and a small loading fee
    mandi_cess = round(gross_amount * 0.015, 2)
    loading_fee = round(body.quantity * 10, 2)   # ₹10 per quintal loading
    net_amount = round(gross_amount - mandi_cess - loading_fee, 2)
    
    receipt_id = f"REC-{secrets.token_hex(4).upper()}"
    farmer_name = current_user.get("full_name", "Farmer")
    farmer_mobile = current_user.get("mobile", "")
    farmer_id_str = current_user.get("farmer_id", "")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO sales (
            user_id, farmer_name, farmer_mobile, farmer_id_str,
            commodity, variety, quantity, unit,
            price_per_unit, gross_amount, mandi_cess, loading_fee,
            net_amount, mandi_name, buyer_name, buyer_contact,
            notes, receipt_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Settled')
    """, (
        user_id,
        farmer_name,
        farmer_mobile,
        farmer_id_str,
        body.commodity,
        body.variety,
        body.quantity,
        body.unit or "Quintal",
        body.price_per_unit,
        gross_amount,
        mandi_cess,
        loading_fee,
        net_amount,
        body.mandi_name or current_user.get("primary_mandi", ""),
        body.buyer_name,
        body.buyer_contact,
        body.notes,
        receipt_id
    ))
    conn.commit()
    sale_id = cursor.lastrowid
    conn.close()
    
    return {
        "success": True,
        "message": "Produce sale recorded successfully",
        "data": {
            "id": sale_id,
            "receipt_id": receipt_id,
            "gross_amount": gross_amount,
            "mandi_cess": mandi_cess,
            "loading_fee": loading_fee,
            "net_amount": net_amount
        }
    }

@router.get("")
@router.get("/")
def get_my_sales(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM sales 
        WHERE user_id = ? 
        ORDER BY transaction_date DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    data = [dict(r) for r in rows]
    return {
        "success": True,
        "message": "Sales records retrieved",
        "data": data
    }

@router.get("/receipt/{receipt_id}")
def get_sale_receipt(receipt_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.*, u.full_name as farmer_name_full, u.village, u.district, u.state, u.farmer_id
        FROM sales s
        JOIN users u ON s.user_id = u.id
        WHERE s.receipt_id = ? AND s.user_id = ?
    """, (receipt_id, user_id))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    return {
        "success": True,
        "message": "Receipt retrieved",
        "data": dict(row)
    }

@router.get("/{sale_id}")
def get_sale_by_id(sale_id: int, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM sales 
        WHERE id = ? AND user_id = ?
    """, (sale_id, user_id))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Sale record not found")
        
    return {
        "success": True,
        "data": dict(row)
    }
