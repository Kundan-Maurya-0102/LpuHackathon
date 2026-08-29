require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/config/database');

// Predefined credentials for quick login during demo/testing
const TEST_MOBILE = '9999999999'; // 10‑digit number
const TEST_PASSWORD = 'Test@1234'; // plaintext password

(async () => {
  try {
    // Hash the password (same method used for real users)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, saltRounds);

    // Insert user – farmer_id can be any placeholder; set verified/active flags
    const [result] = await db.execute(
      'INSERT INTO users (mobile, farmer_id, password_hash, is_verified, is_active) VALUES (?, ?, ?, ?, ?)',
      [TEST_MOBILE, 'TEST-USER-001', passwordHash, true, true]
    );
    console.log('✅ Test user created:');
    console.log('   id      =', result.insertId);
    console.log('   mobile  =', TEST_MOBILE);
    console.log('   password= (plain) ', TEST_PASSWORD);
  } catch (err) {
    console.error('❌ Failed to create test user:', err);
  } finally {
    await db.end();
  }
})();
