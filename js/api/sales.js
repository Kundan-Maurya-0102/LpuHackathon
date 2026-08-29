/**
 * KisanSetu - Sales API Client
 * Handles all sale record creation and retrieval via the backend.
 */

const apiSales = {
  /**
   * Record a new produce sale and generate a J-Form receipt
   * @param {Object} saleData - { commodity, variety, quantity, price_per_unit, mandi_name, ... }
   */
  async createSale(saleData) {
    return await apiClient.post('/sales', saleData);
  },

  /**
   * Get all sales for the currently authenticated farmer
   */
  async getSales() {
    return await apiClient.get('/sales');
  },

  /**
   * Get a specific sale by ID
   */
  async getSaleById(id) {
    return await apiClient.get(`/sales/${id}`);
  },

  /**
   * Get a J-Form receipt by receipt ID
   */
  async getReceipt(receiptId) {
    return await apiClient.get(`/sales/receipt/${receiptId}`);
  }
};

// Expose globally for all pages
window.apiSales = apiSales;
