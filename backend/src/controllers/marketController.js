const marketPriceModel = require('../models/marketPriceModel');

const marketController = {
  async getPrices(req, res, next) {
    try {
      const filters = {
        state: req.query.state,
        district: req.query.district,
        market: req.query.market,
        commodity: req.query.commodity,
        arrival_date: req.query.date
      };

      const prices = await marketPriceModel.findByFilters(filters);
      
      res.json({
        success: true,
        data: prices,
        message: `Found ${prices.length} market prices`
      });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const { state, market, commodity, days } = req.query;
      
      if (!state || !market || !commodity) {
          return res.status(400).json({ success: false, message: 'state, market, and commodity are required' });
      }

      const history = await marketPriceModel.getHistory(state, market, commodity, parseInt(days) || 30);
      
      res.json({
        success: true,
        data: history,
        message: 'Price history retrieved'
      });
    } catch (error) {
      next(error);
    }
  },
  
  async getFilters(req, res, next) {
    try {
        const filters = await marketPriceModel.getUniqueFilters();
        res.json({
            success: true,
            data: filters,
            message: 'Available filters retrieved'
        });
    } catch (error) {
        next(error);
    }
  }
};

module.exports = marketController;
