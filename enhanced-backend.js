const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_jwt_key_hackathon_2026';
const DATA_GOV_API_KEY = '579b464db66ec23bdd000001da37490b38be4b3f787a986d952c045a';

// In-memory storage
const users = new Map();
const otps = new Map();
const sales = [];
let cachedPrices = [];
let pricesCachetime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

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

// Mock market prices data (fallback)
const MOCK_PRICES = [
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

// ==================== UTILITIES ====================

/**
 * Safely parse date string - handles both DD/MM/YYYY and other formats
 */
function safeDateParse(dateStr) {
  if (!dateStr) {
    return new Date().toISOString().split('T')[0];
  }

  // Handle DD/MM/YYYY format
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Assume DD/MM/YYYY
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      if (year.length === 4 && month.length <= 2 && day.length <= 2) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }

  // Handle ISO format or other formats
  try {
    const date = new Date(dateStr);
    if (!isNaN(date)) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Continue to fallback
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Fetch real data from data.gov.in API
 */
async function fetchRealPrices() {
  try {
    // Check cache first
    if (cachedPrices.length > 0 && Date.now() - pricesCachetime < CACHE_DURATION) {
      console.log('[Prices] Using cached data');
      return cachedPrices;
    }

    console.log('[Prices] Fetching from data.gov.in API...');
    
    const response = await axios.get(
      'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
      {
        params: {
          'api-key': DATA_GOV_API_KEY,
          format: 'json',
          limit: 1000,
          sort: 'created_at DESC'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.records && Array.isArray(response.data.records)) {
      const prices = response.data.records.map(r => ({
        state: r.state || 'Unknown',
        district: r.district || 'Unknown',
        market: r.market || r.mandi || 'Unknown Market',
        commodity: r.commodity || 'Unknown',
        variety: r.variety || '',
        min_price: parseFloat(r.min_price) || 0,
        max_price: parseFloat(r.max_price) || 0,
        modal_price: parseFloat(r.modal_price) || 0,
        arrival_date: safeDateParse(r.arrival_date),
        unit: r.unit || 'Quintal',
        source: 'data.gov.in'
      }));

      cachedPrices = prices;
      pricesCachetime = Date.now();
      
      console.log(`[Prices] ✅ Fetched ${prices.length} records from data.gov.in`);
      return prices;
    }
  } catch (error) {
    console.log(`[Prices] ❌ data.gov.in API error: ${error.message}`);
    console.log('[Prices] Falling back to mock data');
  }

  return MOCK_PRICES;
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    timestamp: new Date(),
    backend: 'enhanced-with-real-data',
    cachedPrices: cachedPrices.length
  });
});

/**
 * Send OTP
 * POST /api/auth/send-otp
 * Body: { mobile: "10 digit" }
 */
app.post('/api/auth/send-otp', (req, res) => {
  const { mobile } = req.body;
  
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid mobile number (must be 10 digits)' 
    });
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  otps.set(mobile, { otp, expiresAt, attempts: 0 });
  
  console.log(`[OTP] Sent to ${mobile}: ${otp} (expires in 10 min)`);
  
  res.json({ 
    success: true, 
    message: 'OTP sent successfully',
    debug_otp: otp, // For testing - remove in production
    expires_in: 600 // seconds
  });
});

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 * Body: { mobile: "10 digit", otp: "6 digit" }
 */
app.post('/api/auth/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mobile and OTP required' 
    });
  }

  const storedData = otps.get(mobile);
  
  if (!storedData) {
    return res.status(400).json({ 
      success: false, 
      message: 'OTP not found for this mobile (request OTP first)' 
    });
  }

  if (Date.now() > storedData.expiresAt) {
    otps.delete(mobile);
    return res.status(400).json({ 
      success: false, 
      message: 'OTP expired' 
    });
  }

  if (storedData.attempts >= 3) {
    otps.delete(mobile);
    return res.status(400).json({ 
      success: false, 
      message: 'Too many attempts. Request new OTP.' 
    });
  }

  if (storedData.otp !== otp) {
    storedData.attempts++;
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid OTP',
      attempts_remaining: 3 - storedData.attempts
    });
  }

  // OTP verified
  otps.delete(mobile);
  console.log(`[OTP] ✅ Verified for ${mobile}`);

  res.json({ 
    success: true, 
    message: 'OTP verified successfully'
  });
});

/**
 * Login (Password or OTP)
 * POST /api/auth/login
 * Body: { mobile: "10 digit", password: "string" }
 */
app.post('/api/auth/login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mobile and password required' 
    });
  }

  const user = users.get(mobile);
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'User not found. Please sign up first.' 
    });
  }

  // Check password
  if (password !== user.password) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid password' 
    });
  }

  const token = jwt.sign(
    { id: user.id, mobile: user.mobile },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log(`[Auth] ✅ Login successful for ${mobile}`);

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

/**
 * Get current user
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.mobile);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
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
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
});

/**
 * Get market prices with filters
 * GET /api/market-prices?state=Punjab&district=Jalandhar&commodity=Wheat
 */
app.get('/api/market-prices', async (req, res) => {
  const { state, district, commodity } = req.query;
  
  // Fetch real or cached prices
  const prices = await fetchRealPrices();
  
  let filtered = prices;
  
  if (state) {
    filtered = filtered.filter(p => p.state.toLowerCase() === state.toLowerCase());
  }
  if (district) {
    filtered = filtered.filter(p => p.district.toLowerCase() === district.toLowerCase());
  }
  if (commodity) {
    filtered = filtered.filter(p => p.commodity.toLowerCase() === commodity.toLowerCase());
  }

  res.json({
    success: true,
    data: filtered,
    total: filtered.length,
    source: filtered.length > 0 ? filtered[0].source || 'mock' : 'none',
    message: `Found ${filtered.length} price records`
  });
});

/**
 * Get all unique commodities
 * GET /api/market-prices/commodities
 */
app.get('/api/market-prices/commodities', async (req, res) => {
  const prices = await fetchRealPrices();
  const commodities = [...new Set(prices.map(p => p.commodity))].sort();
  
  res.json({
    success: true,
    data: commodities,
    total: commodities.length
  });
});

/**
 * Get all unique states
 * GET /api/market-prices/states
 */
app.get('/api/market-prices/states', async (req, res) => {
  const prices = await fetchRealPrices();
  const states = [...new Set(prices.map(p => p.state))].sort();
  
  res.json({
    success: true,
    data: states,
    total: states.length
  });
});

/**
 * Get districts by state (or all districts)
 * GET /api/market-prices/districts?state=Punjab
 */
app.get('/api/market-prices/districts', async (req, res) => {
  const { state } = req.query;
  const prices = await fetchRealPrices();
  
  const districts = state 
    ? [...new Set(prices.filter(p => p.state.toLowerCase() === state.toLowerCase()).map(p => p.district))].sort()
    : [...new Set(prices.map(p => p.district))].sort();
  
  res.json({
    success: true,
    data: districts,
    total: districts.length,
    state: state || 'all'
  });
});

/**
 * Create sales record
 * POST /api/sales
 * Header: Authorization: Bearer <token>
 * Body: { commodity, quantity, price, buyer_name, transaction_id? }
 */
app.post('/api/sales', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized - token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { commodity, quantity, price, buyer_name, transaction_id } = req.body;

    if (!commodity || !quantity || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'commodity, quantity, and price are required' 
      });
    }

    const sale = {
      id: sales.length + 1,
      user_id: decoded.id,
      mobile: decoded.mobile,
      commodity,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      buyer_name: buyer_name || 'Anonymous',
      transaction_id: transaction_id || `TXN-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    sales.push(sale);

    console.log(`[Sales] ✅ Sale recorded for user ${decoded.mobile}`);

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: sale
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

/**
 * Get user's sales
 * GET /api/sales
 * Header: Authorization: Bearer <token>
 */
app.get('/api/sales', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized - token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userSales = sales.filter(s => s.user_id === decoded.id);

    res.json({
      success: true,
      data: userSales,
      total: userSales.length
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

/**
 * Signup new user
 * POST /api/auth/signup
 * Body: { mobile, full_name, farmer_id?, state?, district?, village? }
 */
app.post('/api/auth/signup', async (req, res) => {
  const { mobile, full_name, farmer_id, state, district, village, password } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid mobile number (must be 10 digits)' 
    });
  }

  if (users.has(mobile)) {
    return res.status(400).json({ 
      success: false, 
      message: 'User already exists with this mobile' 
    });
  }

  const newUser = {
    id: Math.max(...Array.from(users.values()).map(u => u.id), 0) + 1,
    mobile,
    password: password || '123456', // Default password
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

  console.log(`[Auth] ✅ New user signed up: ${mobile}`);

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
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Enhanced Backend Server running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log('📱 Test Credentials:');
  console.log('   • Phone: 1234567895, Password: kisan123');
  console.log('   • Phone: 9999999999, Password: Test@1234\n');
  
  console.log('🔐 OTP Authentication:');
  console.log('   1. POST /api/auth/send-otp { "mobile": "10 digits" }');
  console.log('   2. Check response for debug_otp');
  console.log('   3. POST /api/auth/verify-otp { "mobile": "...", "otp": "..." }\n');
  
  console.log('📊 Real Data Integration:');
  console.log(`   • API Key: ${DATA_GOV_API_KEY.slice(0, 10)}...`);
  console.log('   • Source: https://api.data.gov.in (APMC Market Prices)');
  console.log('   • Cache: 30 minutes\n');
  
  console.log('📍 Filter by: state, district, commodity');
  console.log(`${'='.repeat(60)}\n`);
  
  // Optionally pre-fetch prices
  fetchRealPrices().then(prices => {
    console.log(`[Init] Cached ${prices.length} prices on startup`);
  });
});

module.exports = app;
