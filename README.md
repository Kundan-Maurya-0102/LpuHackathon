# LpuHackathon
28 august hackthon in lpu kundan,rishi,akshith
https://kundan-maurya-0102.github.io/LpuHackathon/

## Connect Daily Market API

The provided data.gov.in resource is configured in `server.js`, and the frontend calls the local proxy through `js/api.js`.

```js
const KISANSETU_API_URL = "http://localhost:3001/api/daily-prices";
```

Put your key in `.env` as `DATA_GOV_API_KEY=...`, then run `node server.js`. Open the site through `http://localhost:3001`, not by double-clicking `index.html`. If using GitHub Pages, run the proxy locally and the frontend will call `http://localhost:3001`. The browser sends state and district filters after Farmer ID and mobile OTP login; the proxy adds the private key and calls data.gov.in.

### OTP authentication

For initial testing, set this in `.env`:

```env
INITIAL_OTP=123456
```

The user enters `123456`; the code is never displayed by the website. For real mobile delivery, leave `INITIAL_OTP` empty and configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_PHONE`. Then restart `node server.js`. OTPs expire after five minutes and are verified on the server.

Each record should contain crop and mandi names plus prices. These aliases are accepted:

```json
{
	"crop": "Wheat",
	"mandi": "Khanna APMC",
	"state": "Punjab",
	"district": "Ludhiana",
	"lat": 30.7068,
	"lng": 76.2163,
	"min_price": "2420",
	"modal_price": "2510",
	"max_price": "2580",
	"arrivals": "4,200 Qtl"
}
```

The app calculates nearest-market distance from the farmer coordinates, ranks markets by estimated net value after transport, loads map markers and routes from the API response, and shows an error/retry state when live data is unavailable. Real OTP delivery still requires connecting `sendOtpBtn` to an SMS provider/backend; the current browser demo generates the OTP locally.
