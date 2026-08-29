# Database Documentation

KisanSetu uses an embedded SQLite database (`backend_python/data/kisansetu.db`), auto-initialized upon backend startup with built-in schema migrations and initial seed data.

## Core Tables

### `users`
Stores farmer profiles, preferences, and authentication details.
- **id**: Integer Primary Key (Auto Increment)
- **full_name**, **mobile**, **email**: Contact & personal details
- **password_hash**: Secure Bcrypt password hash
- **farmer_id**: Unique Farmer identifier (e.g. `PB-KAP-2026-XXXX`)
- **state**, **district**, **village**: Location details
- **land_acres**: Landholding size in acres
- **primary_mandi**: Preferred primary APMC mandi
- **preferred_vehicle**: Preferred logistics vehicle (e.g. Tractor Trolley, Tempo)
- **crops**: JSON list of cultivated crops
- **preferred_language**: Farmer's chosen UI language (`hi`, `pa`, `en`)
- **latitude**, **longitude**: Precise coordinates for proximity & mandi distance calculations
- **created_at**, **updated_at**: Timestamps

### `market_prices`
Stores APMC Mandi prices fetched dynamically from `data.gov.in`. Acts as a fast local cache.
- **id**: Integer Primary Key
- **state**, **district**, **market**: Mandi location details
- **commodity**, **variety**: Crop and variety information
- **min_price**, **max_price**, **modal_price**: Price in ₹ / Quintal
- **arrival_date**: Date of arrival record
- **created_at**: Timestamp

### `sales`
Stores digital sales receipts (J-Forms) created when produce is sold.
- **id**: Integer Primary Key
- **receipt_id**: Unique receipt string (e.g. `KS-REC-XXXXXXXX`)
- **user_id**: Reference to `users.id`
- **commodity**, **variety**, **quantity**, **unit**, **price_per_unit**, **total_amount**: Transaction metrics
- **mandi_name**, **buyer_name**, **buyer_contact**: Buyer & market details
- **date**: Date string (YYYY-MM-DD)
- **created_at**: Timestamp

### `price_alerts`
Stores automated SMS/push price alert triggers configured by farmers.
- **id**: Integer Primary Key
- **user_id**: Reference to `users.id`
- **commodity**, **mandi**: Monitored crop and market
- **target_price**: Target price threshold
- **created_at**: Timestamp
