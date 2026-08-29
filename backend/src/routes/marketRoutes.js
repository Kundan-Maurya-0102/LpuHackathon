const express = require('express');
const marketController = require('../controllers/marketController');
const authMiddleware = require('../middleware/authMiddleware'); // Optional if we want to restrict

const router = express.Router();

// Allow public access to market prices for now
router.get('/', marketController.getPrices);
router.get('/history', marketController.getHistory);
router.get('/filters', marketController.getFilters);

module.exports = router;
