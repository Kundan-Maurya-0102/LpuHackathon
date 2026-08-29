import requests
from datetime import datetime
from ..config import config
from ..database import get_db_connection

class AgmarknetService:
    def __init__(self):
        self.api_key = config.DATA_GOV_API_KEY
        self.resource_url = config.DATA_GOV_RESOURCE_URL

    def fetch_and_store_prices(self, state: str = None, commodity: str = None, limit: int = 1500) -> dict:
        if not self.api_key:
            return {"success": False, "message": "DATA_GOV_API_KEY not configured"}

        params = {
            "api-key": self.api_key,
            "format": "json",
            "limit": limit
        }
        
        if state:
            params["filters[state]"] = state
        if commodity:
            params["filters[commodity]"] = commodity

        try:
            print(f"[AgmarknetService] 🌐 Fetching live market prices from data.gov.in...")
            response = requests.get(self.resource_url, params=params, timeout=(3.5, 7.0))
            
            if response.status_code != 200:
                return {
                    "success": False, 
                    "message": f"Gov API returned status code {response.status_code}",
                    "details": response.text[:200]
                }

            data = response.json()
            records = data.get("records", [])
            
            if not records:
                return {"success": True, "count": 0, "message": "No new records found for filter"}

            conn = get_db_connection()
            cursor = conn.cursor()
            inserted = 0

            for r in records:
                try:
                    r_state = r.get("state", "").strip()
                    r_district = r.get("district", "").strip()
                    r_market = r.get("market", "").strip()
                    r_commodity = r.get("commodity", "").strip()
                    r_variety = r.get("variety", "").strip()
                    min_p = float(r.get("min_price", 0) or 0)
                    max_p = float(r.get("max_price", 0) or 0)
                    modal_p = float(r.get("modal_price", 0) or 0)
                    
                    # Convert date from DD/MM/YYYY to YYYY-MM-DD
                    raw_date = r.get("arrival_date", "")
                    if "/" in raw_date:
                        parts = raw_date.split("/")
                        arr_date = f"{parts[2]}-{parts[1]}-{parts[0]}" if len(parts) == 3 else datetime.now().strftime("%Y-%m-%d")
                    else:
                        arr_date = raw_date or datetime.now().strftime("%Y-%m-%d")

                    cursor.execute("""
                        INSERT INTO market_prices (
                            state, district, market, commodity, variety,
                            min_price, max_price, modal_price, arrival_date, source
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'data.gov.in')
                        ON CONFLICT(state, district, market, commodity, variety, arrival_date)
                        DO UPDATE SET
                            min_price = excluded.min_price,
                            max_price = excluded.max_price,
                            modal_price = excluded.modal_price
                    """, (r_state, r_district, r_market, r_commodity, r_variety, min_p, max_p, modal_p, arr_date))
                    inserted += 1
                except Exception as e:
                    continue

            conn.commit()
            conn.close()
            print(f"[AgmarknetService] ✅ Successfully updated {inserted} live market prices.")
            return {"success": True, "count": inserted, "message": f"Updated {inserted} records"}

        except Exception as err:
            print(f"[AgmarknetService] ❌ Sync error: {str(err)}")
            return {"success": False, "message": f"Network / API Error: {str(err)}"}

agmarknet_service = AgmarknetService()
