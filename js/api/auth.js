const apiAuth = {
  async signup(userData) {
    const res = await apiClient.post('/auth/signup', userData);
    if (res.success && res.data.token) {
      localStorage.setItem('kisan_token', res.data.token);
      localStorage.setItem('kisan_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  async sendOtp(mobile) {
    return await apiClient.post('/auth/send-otp', { mobile });
  },

  async verifyOtp(mobile, otp) {
    const res = await apiClient.post('/auth/verify-otp', { mobile, otp });
    if (res.success && res.data?.token) {
      localStorage.setItem('kisan_token', res.data.token);
      localStorage.setItem('kisan_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  async login(mobile, password) {
    const res = await apiClient.post('/auth/login', { mobile, password });
    if (res.success && res.data.token) {
      localStorage.setItem('kisan_token', res.data.token);
      localStorage.setItem('kisan_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  async getMe() {
    return await apiClient.get('/auth/me');
  },

  logout() {
    localStorage.removeItem('kisan_token');
    localStorage.removeItem('kisan_user');
  },

  isAuthenticated() {
    return !!localStorage.getItem('kisan_token');
  },

  getUser() {
    const userStr = localStorage.getItem('kisan_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
