const db = require('../config/database');

class SalesModel {
    static async createSale(saleData) {
        const {
            user_id, commodity, variety, quantity, unit, price_per_unit, total_amount, mandi_name, buyer_name, buyer_contact, notes, receipt_id
        } = saleData;
        
        const query = `
            INSERT INTO sales (user_id, commodity, variety, quantity, unit, price_per_unit, total_amount, mandi_name, buyer_name, buyer_contact, notes, receipt_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [user_id, commodity, variety, quantity, unit, price_per_unit, total_amount, mandi_name, buyer_name, buyer_contact, notes, receipt_id];
        
        const [result] = await db.query(query, values);
        return result.insertId;
    }
    
    static async getSalesByUser(user_id) {
        const query = `SELECT * FROM sales WHERE user_id = ? ORDER BY transaction_date DESC`;
        const [rows] = await db.query(query, [user_id]);
        return rows;
    }
    
    static async getSaleByReceiptId(receipt_id, user_id) {
        const query = `SELECT * FROM sales WHERE receipt_id = ? AND user_id = ?`;
        const [rows] = await db.query(query, [receipt_id, user_id]);
        return rows[0];
    }
}

module.exports = SalesModel;
