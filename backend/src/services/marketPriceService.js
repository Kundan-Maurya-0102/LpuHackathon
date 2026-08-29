const axios = require('axios');
const env = require('../config/env');
const marketPriceModel = require('../models/marketPriceModel');

class MarketPriceService {
  constructor() {
    this.apiKey = env.DATA_GOV_API_KEY;
    this.baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
  }

  async fetchAndStorePrices(state = null, commodity = null) {
    if (!this.apiKey) {
      console.warn('[MarketPriceService] No DATA_GOV_API_KEY provided. Skipping fetch.');
      return;
    }

    try {
      console.log(`[MarketPriceService] Fetching prices from data.gov.in...`);
      
      const params = {
        'api-key': this.apiKey,
        format: 'json',
        limit: 2000 // Fetch a large batch
      };
      
      if (state) params['filters[state]'] = state;
      if (commodity) params['filters[commodity]'] = commodity;

      const response = await axios.get(this.baseUrl, { params });
      
      if (response.data && response.data.records) {
        const records = response.data.records.map(r => ({
          state: r.state,
          district: r.district,
          market: r.market,
          commodity: r.commodity,
          variety: r.variety,
          min_price: parseFloat(r.min_price) || 0,
          max_price: parseFloat(r.max_price) || 0,
          modal_price: parseFloat(r.modal_price) || 0,
          // Convert DD/MM/YYYY to YYYY-MM-DD when the API provides a date.
          arrival_date: normalizeArrivalDate(r.arrival_date),
          source: 'data.gov.in'
        }));

        const affected = await marketPriceModel.bulkUpsert(records);
        console.log(`[MarketPriceService] Upserted ${affected} records.`);
        return affected;
      }
    } catch (error) {
      console.error('[MarketPriceService] Fetch failed:', error.message);
    }
  }
}

function normalizeArrivalDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const text = String(value);
  if (text.includes('/')) {
    const parts = text.split('/');
    if (parts.length === 3) return parts.reverse().join('-');
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
}

module.exports = new MarketPriceService();
