const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_jwt_key_hackathon_2026';
const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const envKey = envFile.match(/^DATA_GOV_API_KEY=(.+)$/m)?.[1]?.trim();
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || envKey || '';
let livePrices = null;
let livePricesFetchedAt = 0;

// In-memory storage
const users = new Map();
const otps = new Map();
const sales = [];

// Predefined test users
const TEST_USERS = [
  {
    id: 1,
    mobile: '1234567895',
    password: 'kisan123',
    full_name: 'Demo Farmer',
    farmer_id: 'DEMO-0000-0001',
    state: 'Punjab',
    district: 'Jalandhar',
    village: 'Phagwara',
    is_verified: true
  },
  {
    id: 2,
    mobile: '9999999999',
    password: 'Test@1234',
    full_name: 'Test User',
    farmer_id: 'TEST-USER-001',
    state: 'Haryana',
    district: 'Hisar',
    village: 'Hansi',
    is_verified: true
  }
];

// Populate users
TEST_USERS.forEach(user => {
  users.set(user.mobile, user);
});

// Mock market prices data
const MOCK_PRICES = [
  {
    state: 'Punjab',
    district: 'Kapurthala',
    market: 'Kapurthala Mandi',
    commodity: 'Wheat',
    variety: 'PBW 343',
    min_price: 2390,
    max_price: 2540,
    modal_price: 2465,
    arrival_date: new Date().toISOString().split('T')[0],
    unit: 'Quintal'
  },
  {
    state: 'Punjab',
    district: 'Jalandhar',
    market: 'Jalandhar Mandi',
    commodity: 'Wheat',
    variety: 'PBW 343',
    min_price: 2400,
    max_price: 2550,
    modal_price: 2475,
    arrival_date: new Date().toISOString().split('T')[0],
    unit: 'Quintal'
  },
  {
    state: 'Punjab',
    district: 'Jalandhar',
    market: 'Jalandhar Mandi',
    commodity: 'Rice',
    variety: 'Basmati',
    min_price: 4200,
    max_price: 4600,
    modal_price: 4400,
    arrival_date: new Date().toISOString().split('T')[0],
    unit: 'Quintal'
  },
  {
    state: 'Haryana',
    district: 'Hisar',
    market: 'Hisar Mandi',
    commodity: 'Cotton',
    variety: 'White',
    min_price: 5500,
    max_price: 5800,
    modal_price: 5650,
    arrival_date: new Date().toISOString().split('T')[0],
    unit: 'Quintal'
  },
  {
    state: 'Haryana',
    district: 'Hisar',
    market: 'Hisar Mandi',
    commodity: 'Mustard',
    variety: 'Yellow',
    min_price: 5000,
    max_price: 5300,
    modal_price: 5150,
    arrival_date: new Date().toISOString().split('T')[0],
    unit: 'Quintal'
  }
];

function safeArrivalDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const text = String(value);
  if (text.includes('/')) {
    const parts = text.split('/');
    if (parts.length === 3) return parts.reverse().join('-');
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

async function getPrices() {
  if (livePrices && Date.now() - livePricesFetchedAt < 30 * 60 * 1000) return livePrices;
  try {
    const url = new URL('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070');
    url.search = new URLSearchParams({ 'api-key': DATA_GOV_API_KEY, format: 'json', limit: '1000' });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`data.gov.in returned ${response.status}`);
    const payload = await response.json();
    const records = Array.isArray(payload.records) ? payload.records.map(record => ({
      state: record.state || 'Unknown',
      district: record.district || 'Unknown',
      market: record.market || 'Unknown Market',
      commodity: record.commodity || 'Unknown',
      variety: record.variety || '',
      min_price: Number(record.min_price) || 0,
      max_price: Number(record.max_price) || 0,
      modal_price: Number(record.modal_price) || 0,
      arrival_date: safeArrivalDate(record.arrival_date),
      unit: 'Quintal',
      source: 'data.gov.in'
    })) : [];
    if (records.length) {
      livePrices = records;
      livePricesFetchedAt = Date.now();
      console.log(`[Market] Loaded ${records.length} live records`);
      return records;
    }
  } catch (error) {
    console.warn(`[Market] Live fetch failed: ${error.message}; using demo data`);
  }
  return MOCK_PRICES;
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { mobile } = req.body;
  
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: 'Invalid mobile number' });
  }

  const otp = '123456'; // Fixed OTP for testing
  otps.set(mobile, { otp, expiresAt: Date.now() + 10 * 60000, attempts: 0 });
  
  res.json({ 
    success: true, 
    message: 'OTP sent successfully',
    debug_otp: otp // For development, show OTP
  });
});

// Verify OTP and create a login session.
app.post('/api/auth/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;
  const saved = otps.get(mobile);
  if (!saved || Date.now() > saved.expiresAt || saved.otp !== String(otp)) {
    return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
  }
  const user = users.get(mobile);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  otps.delete(mobile);
  const token = jwt.sign({ id: user.id, mobile: user.mobile }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, message: 'OTP verified', data: { token, user } });
});

// Verify OTP & Login
app.post('/api/auth/login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: 'Mobile and password required' });
  }

  const user = users.get(mobile);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  // For demo, accept any password or the correct one
  if (password !== user.password && password !== '123456') {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  const token = jwt.sign(
    { id: user.id, mobile: user.mobile },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        mobile: user.mobile,
        full_name: user.full_name,
        farmer_id: user.farmer_id,
        state: user.state,
        district: user.district,
        village: user.village,
        is_verified: user.is_verified
      }
    }
  });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.mobile);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        mobile: user.mobile,
        full_name: user.full_name,
        farmer_id: user.farmer_id,
        state: user.state,
        district: user.district,
        village: user.village,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Get market prices
app.get('/api/market-prices', async (req, res) => {
  const { state, district, commodity } = req.query;
  
  let filtered = await getPrices();
  
  if (state) {
    filtered = filtered.filter(p => p.state.toLowerCase() === state.toLowerCase());
  }
  if (district) {
    filtered = filtered.filter(p => p.district.toLowerCase() === district.toLowerCase());
  }
  if (commodity) {
    filtered = filtered.filter(p => p.commodity.toLowerCase() === commodity.toLowerCase());
  }

  // Keep the predefined demo records available when live data has no match.
  if (!filtered.length && (state || district || commodity)) {
    filtered = MOCK_PRICES.filter(p =>
      (!state || p.state.toLowerCase() === state.toLowerCase()) &&
      (!district || p.district.toLowerCase() === district.toLowerCase()) &&
      (!commodity || p.commodity.toLowerCase() === commodity.toLowerCase())
    );
  }
  if (!filtered.length) filtered = prices;

  res.json({
    success: true,
    data: filtered,
    message: `Found ${filtered.length} price records`
  });
});

// Get all commodities (unique list)
app.get('/api/market-prices/commodities', async (req, res) => {
  const prices = await getPrices();
  const commodities = [...new Set(prices.map(p => p.commodity))].sort();
  res.json({
    success: true,
    data: commodities
  });
});

// Get all states
app.get('/api/market-prices/states', async (req, res) => {
  const prices = await getPrices();
  const states = [...new Set(prices.map(p => p.state))].sort();
  res.json({
    success: true,
    data: states
  });
});

// Get districts by state
app.get('/api/market-prices/districts', async (req, res) => {
  const { state } = req.query;
  const prices = await getPrices();
  const districts = state 
    ? [...new Set(prices.filter(p => p.state.toLowerCase() === state.toLowerCase()).map(p => p.district))]
    : [...new Set(prices.map(p => p.district))];
  
  res.json({
    success: true,
    data: districts
  });
});

// Create sales record
app.post('/api/sales', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { commodity, quantity, price, buyer_name, transaction_id } = req.body;

    const sale = {
      id: sales.length + 1,
      user_id: decoded.id,
      commodity,
      quantity,
      price,
      buyer_name,
      transaction_id: transaction_id || `TXN-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    sales.push(sale);

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: sale
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Get user sales
app.get('/api/sales', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userSales = sales.filter(s => s.user_id === decoded.id);

    res.json({
      success: true,
      data: userSales
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Signup new user
app.post('/api/auth/signup', async (req, res) => {
  const { mobile, farmer_id, full_name, state, district, village } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: 'Invalid mobile number' });
  }

  if (users.has(mobile)) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const newUser = {
    id: Math.max(...Array.from(users.values()).map(u => u.id), 0) + 1,
    mobile,
    password: '123456', // Default password for new users
    full_name: full_name || 'New Farmer',
    farmer_id: farmer_id || `FARMER-${mobile}`,
    state: state || 'Unknown',
    district: district || 'Unknown',
    village: village || 'Unknown',
    is_verified: true
  };

  users.set(mobile, newUser);

  const token = jwt.sign(
    { id: newUser.id, mobile: newUser.mobile },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      token,
      user: {
        id: newUser.id,
        mobile: newUser.mobile,
        full_name: newUser.full_name,
        farmer_id: newUser.farmer_id,
        state: newUser.state,
        district: newUser.district,
        village: newUser.village,
        is_verified: newUser.is_verified
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Mock Backend Server running on http://localhost:${PORT}`);
  console.log('\n📱 Predefined Test Credentials:');
  console.log('   Phone: 1234567895, Password: kisan123');
  console.log('   Phone: 9999999999, Password: Test@1234');
  console.log('   (Or any mobile + OTP: 123456)\n');
});
