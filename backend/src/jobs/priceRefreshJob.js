const cron = require('node-cron');
const marketPriceService = require('../services/marketPriceService');

// Run every day at 6:00 AM and 6:00 PM
cron.schedule('0 6,18 * * *', async () => {
  console.log('[CRON] Starting market price refresh job...');
  try {
    // Fetch generic latest data
    await marketPriceService.fetchAndStorePrices();
    console.log('[CRON] Market price refresh completed successfully.');
  } catch (error) {
    console.error('[CRON] Market price refresh failed:', error);
  }
});

console.log('[CRON] Price refresh job scheduled (6AM/6PM daily).');
