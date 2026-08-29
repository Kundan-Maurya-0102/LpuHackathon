const db = require('../config/database');

const marketPriceModel = {
  async bulkUpsert(prices) {
    if (!prices || prices.length === 0) return 0;

    const query = `
      INSERT INTO market_prices 
      (state, district, market, commodity, variety, min_price, max_price, modal_price, arrival_date, source)
      VALUES ?
      ON DUPLICATE KEY UPDATE
      min_price = VALUES(min_price),
      max_price = VALUES(max_price),
      modal_price = VALUES(modal_price),
      fetched_at = CURRENT_TIMESTAMP
    `;

    const values = prices.map(p => [
      p.state, p.district, p.market, p.commodity, p.variety, 
      p.min_price, p.max_price, p.modal_price, p.arrival_date, p.source
    ]);

    const [result] = await db.query(query, [values]);
    return result.affectedRows;
  },

  async findByFilters(filters) {
    let query = 'SELECT * FROM market_prices WHERE 1=1';
    const params = [];

    if (filters.state) { query += ' AND state = ?'; params.push(filters.state); }
    if (filters.district) { query += ' AND district = ?'; params.push(filters.district); }
    if (filters.commodity) { query += ' AND commodity = ?'; params.push(filters.commodity); }
    if (filters.market) { query += ' AND market = ?'; params.push(filters.market); }
    
    // Default to last 7 days if no specific date
    if (filters.arrival_date) {
        query += ' AND arrival_date = ?'; 
        params.push(filters.arrival_date);
    } else {
        query += ' AND arrival_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    }

    query += ' ORDER BY arrival_date DESC, modal_price DESC LIMIT 100';

    const [rows] = await db.execute(query, params);
    return rows;
  },

  async getHistory(state, market, commodity, days = 30) {
    const query = `
      SELECT arrival_date, modal_price, min_price, max_price 
      FROM market_prices 
      WHERE state = ? AND market = ? AND commodity = ? 
      AND arrival_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY arrival_date ASC
    `;
    const [rows] = await db.execute(query, [state, market, commodity, days]);
    return rows;
  },
  
  async getUniqueFilters() {
     const [states] = await db.execute('SELECT DISTINCT state FROM market_prices ORDER BY state');
     const [commodities] = await db.execute('SELECT DISTINCT commodity FROM market_prices ORDER BY commodity');
     return {
         states: states.map(r => r.state),
         commodities: commodities.map(r => r.commodity)
     };
  }
};

module.exports = marketPriceModel;
