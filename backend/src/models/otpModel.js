const db = require('../config/database');

const otpModel = {
  async create(userId, mobile, otpHash, expiresAt) {
    const [result] = await db.execute(
      'INSERT INTO otp_verifications (user_id, mobile, otp_hash, expires_at) VALUES (?, ?, ?, ?)',
      [userId || null, mobile, otpHash, expiresAt]
    );
    return result.insertId;
  },

  async findValidOtp(mobile) {
    const [rows] = await db.execute(
      'SELECT * FROM otp_verifications WHERE mobile = ? AND expires_at > NOW() AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [mobile]
    );
    return rows[0];
  },

  async markAsVerified(id) {
    await db.execute('UPDATE otp_verifications SET verified = TRUE WHERE id = ?', [id]);
  },
  
  async incrementAttempts(id) {
     await db.execute('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [id]);
  }
};

module.exports = otpModel;
