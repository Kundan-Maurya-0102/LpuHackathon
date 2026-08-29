const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const resourceUrl = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const envPath = path.join(root, ".env");
const otpStore = new Map();

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) process.env[match[1].trim()] = match[2].trim();
  });
}

function send(response, status, body, contentType = "application/json") {
  response.writeHead(status, { "Content-Type": contentType, "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
  response.end(body);
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return JSON.parse(body || "{}");
}

async function sendSms(phone, otp) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_PHONE) return false;
  const payload = new URLSearchParams({
    To: `+91${phone}`,
    From: TWILIO_FROM_PHONE,
    Body: `Your KisanSetu verification code is ${otp}. It expires in 5 minutes.`
  });
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: payload
  });
  return smsResponse.ok;
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    response.end();
    return;
  }

  // Forward browser API calls to the local Express backend for public ngrok access.
  if (request.url.startsWith("/api/") && request.url !== "/api/health") {
    const proxyRequest = http.request({
      hostname: "127.0.0.1",
      port: 3000,
      path: request.url,
      method: request.method,
      headers: { ...request.headers, host: "127.0.0.1:3000" }
    }, proxyResponse => {
      response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    });
    proxyRequest.on("error", error => send(response, 502, JSON.stringify({ error: "Backend unavailable", detail: error.message })));
    request.pipe(proxyRequest);
    return;
  }

  if (request.url === "/api/health") {
    send(response, 200, JSON.stringify({ marketApi: Boolean(process.env.DATA_GOV_API_KEY), smsApi: Boolean(process.env.TWILIO_ACCOUNT_SID) }));
    return;
  }

  if (request.method === "POST" && request.url === "/api/auth/send-otp") {
    try {
      const { phone, farmerId } = await readJson(request);
      if (!/^\d{10}$/.test(phone) || !/^[A-Z]{2}-\d{4}-\d{4}$/.test(String(farmerId).toUpperCase())) {
        send(response, 400, JSON.stringify({ error: "Valid phone and Farmer ID are required." }));
        return;
      }
      const otp = process.env.INITIAL_OTP || String(Math.floor(100000 + Math.random() * 900000));
      otpStore.set(phone, { farmerId: String(farmerId).toUpperCase(), otp, expiresAt: Date.now() + 5 * 60 * 1000 });
      const delivered = await sendSms(phone, otp);
      if (!delivered && !process.env.INITIAL_OTP) {
        send(response, 503, JSON.stringify({ error: "SMS provider is not configured. Add Twilio credentials or INITIAL_OTP for testing." }));
        return;
      }
      send(response, 200, JSON.stringify({ ok: true, mode: delivered ? "sms" : "initial-otp" }));
    } catch (error) {
      send(response, 400, JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (request.method === "POST" && request.url === "/api/auth/verify-otp") {
    try {
      const { phone, farmerId, otp } = await readJson(request);
      const saved = otpStore.get(phone);
      if (!saved || saved.farmerId !== String(farmerId).toUpperCase() || saved.expiresAt < Date.now() || saved.otp !== String(otp)) {
        send(response, 401, JSON.stringify({ error: "Invalid or expired OTP." }));
        return;
      }
      otpStore.delete(phone);
      send(response, 200, JSON.stringify({ ok: true }));
    } catch (error) {
      send(response, 400, JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (request.url.startsWith("/api/daily-prices")) {
    if (!process.env.DATA_GOV_API_KEY) {
      send(response, 500, JSON.stringify({ error: "DATA_GOV_API_KEY is missing from .env" }));
      return;
    }
    const incoming = new URL(request.url, "http://localhost").searchParams;
    const query = new URLSearchParams({
      "api-key": process.env.DATA_GOV_API_KEY,
      format: "json",
      limit: incoming.get("limit") || "100"
    });
    ["state", "district"].forEach(field => {
      const value = incoming.get(`filters[${field}]`);
      if (value) query.set(`filters[${field}]`, value);
    });
    try {
      const apiResponse = await fetch(`${resourceUrl}?${query}`);
      const body = await apiResponse.text();
      send(response, apiResponse.status, body);
    } catch (error) {
      send(response, 502, JSON.stringify({ error: "Unable to reach data.gov.in", detail: error.message }));
    }
    return;
  }

  if (request.method === "GET") {
    const filePath = path.join(root, request.url === "/" ? "index.html" : request.url.split("?")[0]);
    if (filePath.startsWith(root) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const extension = path.extname(filePath);
      const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg" };
      send(response, 200, fs.readFileSync(filePath), types[extension] || "application/octet-stream");
      return;
    }
  }
  send(response, 404, JSON.stringify({ error: "Not found" }));
});

server.listen(3001, () => console.log("KisanSetu proxy running at http://localhost:3001"));
