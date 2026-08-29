# API Documentation

The KisanSetu backend provides a RESTful API to communicate with the frontend. All endpoints are prefixed with `/api`.

## Authentication

### `POST /api/auth/signup`
Creates a new user account.
- **Body**: `{ full_name, mobile, password, state, district, village, land_acres, preferred_language }`
- **Response**: `201 Created` with JWT `token` and `user` data.

### `POST /api/auth/login`
Authenticates an existing user.
- **Body**: `{ mobile, password }`
- **Response**: `200 OK` with JWT `token` and `user` data.

### `GET /api/auth/me`
Retrieves the profile of the currently authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with `user` data.

---

## Market Prices

### `GET /api/market-prices`
Retrieves current market prices based on search filters. If no local data exists for today, fetches it from the `data.gov.in` API.
- **Query Params**:
  - `state` (optional)
  - `district` (optional)
  - `commodity` (optional)
- **Response**: `200 OK` with array of price records.

### `GET /api/market-prices/history`
Retrieves historical price trends for a specific commodity in a specific market over the last 30 days.
- **Query Params**:
  - `market` (required)
  - `commodity` (required)
- **Response**: `200 OK` with array of historical records sorted by date.

---

## Sales & Receipts

### `POST /api/sales`
Records a new sale of agricultural produce and generates a digital receipt.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ commodity, quantity, unit, price_per_unit, mandi_name, buyer_name }`
- **Response**: `201 Created` with generated `receipt_id`.

### `GET /api/sales`
Retrieves all sales records for the authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with array of sales records.

### `GET /api/sales/:receipt_id`
Retrieves the details of a specific sale using its receipt ID.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with the sale data.
