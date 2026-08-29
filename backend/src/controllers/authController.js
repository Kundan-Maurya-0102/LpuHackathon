const userModel = require('../models/userModel');
const otpModel = require('../models/otpModel');
const smsService = require('../services/smsService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// ── Predefined demo credentials (no DB lookup needed) ──
const DEMO_CREDENTIALS = {
  mobile: '1234567895',
  password: 'kisan123',
  user: {
    id: 0,
    mobile: '1234567895',
    full_name: 'Demo Farmer',
    farmer_id: 'DEMO-0000-0001',
    state: 'Punjab',
    district: 'Jalandhar',
    village: 'Phagwara',
    is_verified: true
  }
};

const authController = {
  async sendOtp(req, res, next) {
    try {
      const { mobile } = req.body;
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
      
      const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins
      await otpModel.create(null, mobile, otp, expiresAt);
      
      const smsRes = await smsService.sendOtp(mobile, otp);
      if (smsRes.success) {
        // In mock/dev mode, also return the OTP so the frontend can show it
        const responseData = { success: true, message: 'OTP sent successfully' };
        if (env.NODE_ENV === 'development' || env.SMS_PROVIDER === 'mock') {
          responseData.debug_otp = otp; // Only in dev/mock mode
        }
        res.json(responseData);
      } else {
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
      }
    } catch (error) {
      next(error);
    }
  },

  async signup(req, res, next) {
    try {
      const { mobile, farmer_id, otp } = req.body;

      const validOtpRecord = await otpModel.findValidOtp(mobile);
      if (!validOtpRecord || validOtpRecord.otp_hash !== otp) {
         if (validOtpRecord) await otpModel.incrementAttempts(validOtpRecord.id);
         return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
      
      await otpModel.markAsVerified(validOtpRecord.id);

      let existingUser = await userModel.findByMobile(mobile);
      if (existingUser) {
        // User already exists — just log them in instead of erroring
        const token = jwt.sign({ id: existingUser.id, mobile }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
        delete existingUser.password_hash;
        return res.status(200).json({
          success: true,
          data: { token, user: existingUser },
          message: 'Welcome back! Logged in successfully'
        });
      }

      const userId = await userModel.create({
        mobile,
        farmer_id
      });

      const token = jwt.sign({ id: userId, mobile }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

      res.status(201).json({
        success: true,
        data: { token, user: { id: userId, mobile, farmer_id } },
        message: 'Signup successful'
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { mobile, password } = req.body;

      // ── Check predefined demo credentials first ──
      if (mobile === DEMO_CREDENTIALS.mobile && password === DEMO_CREDENTIALS.password) {
        const token = jwt.sign(
          { id: DEMO_CREDENTIALS.user.id, mobile },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRES_IN }
        );
        return res.json({
          success: true,
          data: { token, user: { ...DEMO_CREDENTIALS.user } },
          message: 'Login successful (Demo Account)'
        });
      }

      const user = await userModel.findByMobile(mobile);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials — account not found' });
      }

      // If user has no password (signed up via OTP only), allow any password
      if (!user.password_hash) {
        const token = jwt.sign({ id: user.id, mobile: user.mobile }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
        delete user.password_hash;
        return res.json({
          success: true,
          data: { token, user },
          message: 'Login successful'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials — wrong password' });
      }

      const token = jwt.sign({ id: user.id, mobile: user.mobile }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
      delete user.password_hash;

      res.json({
        success: true,
        data: { token, user },
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      // Demo user bypass
      if (req.user.id === 0) {
        return res.json({ success: true, data: { ...DEMO_CREDENTIALS.user } });
      }
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      delete user.password_hash;
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
