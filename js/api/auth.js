/**
 * KisanSetu - Auth API Client
 * Handles OTP login, signup, profile management, JWT token storage.
 * Token key: 'kisansetu_token' | User key: 'kisansetu_user'
 */

const apiAuth = {
  /**
   * Step 1: Request OTP to be sent via SMS to mobile number
   */
  async sendOtp(mobile) {
    return await apiClient.post('/auth/send-otp', { mobile });
  },

  /**
   * Step 2: Verify OTP and login/create account (used by login.js)
   * Auto-creates new user if mobile doesn't exist in DB.
   */
  async verifyLoginOtp(body) {
    // body: { mobile, otp, full_name?, state?, district?, village?, land_acres? }
    const res = await apiClient.post('/auth/verify-login-otp', body);
    if (res.success && res.data && res.data.token) {
      localStorage.setItem('kisansetu_token', res.data.token);
      localStorage.setItem('kisansetu_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Full signup flow (requires OTP verification first)
   */
  async signup(userData) {
    const res = await apiClient.post('/auth/signup', userData);
    if (res.success && res.data && res.data.token) {
      localStorage.setItem('kisansetu_token', res.data.token);
      localStorage.setItem('kisansetu_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Password-based login (for demo farmer: 9876543210 / kisan123)
   */
  async login(mobile, password) {
    const res = await apiClient.post('/auth/login', { mobile, password });
    if (res.success && res.data && res.data.token) {
      localStorage.setItem('kisansetu_token', res.data.token);
      localStorage.setItem('kisansetu_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Fetch current user profile from DB (requires valid JWT)
   */
  async getMe() {
    return await apiClient.get('/auth/me');
  },

  /**
   * Update farmer profile in DB (persists to SQLite via PUT /auth/profile)
   */
  async updateProfile(data) {
    // data: { full_name?, state?, district?, village?, land_acres?, crops?, preferred_language? }
    const res = await apiClient.put('/auth/profile', data);
    if (res.success && res.data) {
      // Keep localStorage in sync with DB
      const current = this.getUser() || {};
      const updated = { ...current, ...res.data };
      localStorage.setItem('kisansetu_user', JSON.stringify(updated));
    }
    return res;
  },

  /**
   * Clear all auth tokens and user data
   */
  logout() {
    localStorage.removeItem('kisansetu_token');
    localStorage.removeItem('kisansetu_user');
    // Also clean up old key names in case of migration
    localStorage.removeItem('kisan_token');
    localStorage.removeItem('kisan_user');
  },

  /**
   * Check if farmer is currently authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('kisansetu_token');
  },

  /**
   * Get cached user object from localStorage
   */
  getUser() {
    const userStr = localStorage.getItem('kisansetu_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
};

// Expose globally for all pages
window.apiAuth = apiAuth;
