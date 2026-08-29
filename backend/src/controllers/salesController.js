const SalesModel = require('../models/salesModel');
const crypto = require('crypto');

const salesController = {
    async createSale(req, res, next) {
        try {
            const user_id = req.user.id;
            const {
                commodity, variety, quantity, unit, price_per_unit, mandi_name, buyer_name, buyer_contact, notes
            } = req.body;

            if (!commodity || !quantity || !price_per_unit) {
                return res.status(400).json({ success: false, message: 'Commodity, quantity, and price_per_unit are required' });
            }

            const total_amount = parseFloat(quantity) * parseFloat(price_per_unit);
            
            // Generate unique receipt ID (e.g., REC-12345678)
            const receipt_id = 'REC-' + crypto.randomBytes(4).toString('hex').toUpperCase();

            const saleData = {
                user_id,
                commodity,
                variety: variety || null,
                quantity: parseFloat(quantity),
                unit: unit || 'Quintal',
                price_per_unit: parseFloat(price_per_unit),
                total_amount,
                mandi_name: mandi_name || null,
                buyer_name: buyer_name || null,
                buyer_contact: buyer_contact || null,
                notes: notes || null,
                receipt_id
            };

            const insertId = await SalesModel.createSale(saleData);

            res.status(201).json({
                success: true,
                message: 'Sale recorded successfully',
                data: {
                    id: insertId,
                    receipt_id,
                    total_amount
                }
            });
        } catch (error) {
            next(error);
        }
    },

    async getMySales(req, res, next) {
        try {
            const user_id = req.user.id;
            const sales = await SalesModel.getSalesByUser(user_id);
            
            res.json({
                success: true,
                message: 'Sales records retrieved',
                data: sales
            });
        } catch (error) {
            next(error);
        }
    },
    
    async getSaleReceipt(req, res, next) {
        try {
            const user_id = req.user.id;
            const { receipt_id } = req.params;
            
            const sale = await SalesModel.getSaleByReceiptId(receipt_id, user_id);
            if (!sale) {
                return res.status(404).json({ success: false, message: 'Receipt not found' });
            }
            
            res.json({
                success: true,
                message: 'Receipt retrieved',
                data: sale
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = salesController;
