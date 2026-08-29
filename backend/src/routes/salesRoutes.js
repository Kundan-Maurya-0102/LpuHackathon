const express = require('express');
const salesController = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', salesController.createSale);
router.get('/', salesController.getMySales);
router.get('/:receipt_id', salesController.getSaleReceipt);

module.exports = router;
