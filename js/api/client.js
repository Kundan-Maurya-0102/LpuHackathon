/**
 * KisanSetu - Unified 24/7 Resilient API Client
 * Base HTTP client for all backend communication with automatic retry,
 * keep-alive pinging, and offline recovery.
 * Token key unified to 'kisansetu_token' across the entire app.
 */

const API_BASE_URL = (() => {
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    const port = window.location.port;
    const proto = window.location.protocol;
    // If opened via raw file:// or live-server ports (8080, 8000, 5500), point to FastAPI port 3000
    if (proto === 'file:' || port === '8080' || port === '8000' || port === '5500') {
      return 'http://localhost:3000/api';
    }
    // Otherwise use origin /api (works on localhost:3000, tunnels, and network IPs)
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:3000/api';
})();

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this._startKeepAlivePing();
  }

  /**
   * Keep-Alive Heartbeat: pings the backend every 2.5 minutes
   * Keeps tunnels and server processes permanently warm.
   */
  _startKeepAlivePing() {
    if (typeof window === "undefined" || !window.setInterval) return;
    setInterval(async () => {
      try {
        const pingUrl = this.baseUrl.replace(/\/api$/, '') + '/health';
        await fetch(pingUrl, {
          method: 'GET',
          headers: {
            'X-Pinggy-No-Screen': 'true',
            'bypass-tunnel-reminder': 'true',
            'ngrok-skip-browser-warning': 'true',
          },
          cache: 'no-store'
        });
      } catch (err) {
        // Silent background ping
      }
    }, 150000); // 2.5 mins
  }

  /**
   * Robust request with automatic retry for transient network drops
   */
  async request(endpoint, options = {}, retries = 2) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('kisansetu_token');

    const headers = {
      'Content-Type': 'application/json',
      'X-Pinggy-No-Screen': 'true',
      'bypass-tunnel-reminder': 'true',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const errMsg = (data && data.message) || `HTTP error ${response.status}`;
          throw new Error(errMsg);
        }

        return data || { success: true };
      } catch (error) {
        lastError = error;
        // If this is a network failure and we have retries left, wait and retry
        const isGet = !options.method || options.method === 'GET';
        if (attempt < retries && (isGet || error.name === 'TypeError')) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    console.warn(`[KisanSetu API] Request to ${endpoint} failed:`, lastError?.message);
    throw lastError;
  }

  get(endpoint, params = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') cleanParams[k] = v;
    });
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

// Expose globally so all pages can access without module imports
window.apiClient = apiClient;
