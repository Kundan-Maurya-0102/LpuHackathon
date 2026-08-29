const apiSales = {
  async createSale(saleData) {
    return await apiClient.post('/sales', saleData);
  },

  async getSales(page = 1, limit = 10) {
    return await apiClient.get('/sales', { page, limit });
  },
  
  async getSaleById(id) {
    return await apiClient.get(`/sales/${id}`);
  }
};
