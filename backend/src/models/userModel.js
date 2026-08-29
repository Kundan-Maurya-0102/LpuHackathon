const db = require('../config/database');

const userModel = {
  async findByMobile(mobile) {
    const [rows] = await db.execute('SELECT * FROM users WHERE mobile = ?', [mobile]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async create(userData) {
    const { mobile, farmer_id } = userData;
    const [result] = await db.execute(
      'INSERT INTO users (mobile, farmer_id) VALUES (?, ?)',
      [mobile, farmer_id]
    );
    return result.insertId;
  }
};

module.exports = userModel;
