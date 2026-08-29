/**
 * KisanSetu - Market Prices API Client
 * Communicates with the backend /api/market-prices endpoints
 * which serve real-time APMC data from SQLite (seeded from data.gov.in).
 */

const apiMarket = {
  /**
   * Fetch all or filtered market prices from SQLite DB
   * @param {Object} filters - { state, district, market, commodity, date }
   */
  async getPrices(filters = {}) {
    return await apiClient.get('/market-prices', filters);
  },

  /**
   * Fetch price history trend for a commodity
   * @param {string} state
   * @param {string} market
   * @param {string} commodity
   * @param {number} days - 7, 30, 90, or 365
   */
  async getHistory(state, market, commodity, days = 30) {
    return await apiClient.get('/market-prices/history', { state, market, commodity, days });
  },

  /**
   * Get available filter options (states, districts, commodities)
   */
  async getFilters() {
    return await apiClient.get('/market-prices/filters');
  },

  /**
   * Trigger a real-time sync from data.gov.in Agmarknet API
   * Stores fresh APMC prices into SQLite DB.
   * @param {string} state - Filter by state (e.g. 'Punjab')
   * @param {string} commodity - Filter by commodity name
   * @param {number} limit - Max records to fetch (default 1000)
   */
  async syncPrices(state = null, commodity = null, limit = 1000) {
    const params = {};
    if (state) params.state = state;
    if (commodity) params.commodity = commodity;
    params.limit = limit;
    return await apiClient.post(`/market-prices/sync?${new URLSearchParams(params).toString()}`, {});
  }
};

// Expose globally for all pages
window.apiMarket = apiMarket;
