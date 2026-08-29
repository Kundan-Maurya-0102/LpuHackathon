const apiMarket = {
  async getPrices(filters = {}) {
    return await apiClient.get('/market-prices', filters);
  },

  async getHistory(state, market, commodity, days = 30) {
    return await apiClient.get('/market-prices/history', { state, market, commodity, days });
  },

  async getFilters() {
    return await apiClient.get('/market-prices/filters');
  }
};
