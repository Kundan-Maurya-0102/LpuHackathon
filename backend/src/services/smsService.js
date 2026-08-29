const env = require('../config/env');

class SmsService {
  constructor() {
    this.provider = env.SMS_PROVIDER;
    this.apiKey = env.SMS_API_KEY;
    this.senderId = env.SMS_SENDER_ID;
  }

  async sendOtp(mobile, otp) {
    console.log(`[SMS_SERVICE] Sending OTP ${otp} to ${mobile} via ${this.provider}`);
    
    if (this.provider === 'mock') {
      // In mock mode, we just log it and succeed
      return { success: true, message: 'Mock OTP sent', messageId: 'mock_' + Date.now() };
    }
    
    // Placeholder for actual SMS provider integrations (Twilio, MSG91, etc.)
    // if (this.provider === 'msg91') { return await this._sendMsg91(mobile, otp); }
    
    return { success: false, message: `Provider ${this.provider} not implemented` };
  }
}

module.exports = new SmsService();
