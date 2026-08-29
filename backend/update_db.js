const mysql = require('mysql2/promise');

async function updateDB() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'kisansetu_db'
  });

  try {
    // Add farmer_id column
    try {
      await connection.query('ALTER TABLE users ADD COLUMN farmer_id VARCHAR(50);');
      console.log('Added farmer_id column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('farmer_id column already exists');
      } else {
        throw e;
      }
    }

    // Modify existing columns to allow NULL
    await connection.query('ALTER TABLE users MODIFY full_name VARCHAR(100) NULL;');
    await connection.query('ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;');
    await connection.query('ALTER TABLE users MODIFY state VARCHAR(50) NULL;');
    await connection.query('ALTER TABLE users MODIFY district VARCHAR(50) NULL;');
    await connection.query('ALTER TABLE users MODIFY village VARCHAR(100) NULL;');
    
    console.log('Successfully updated users table schema.');
  } catch (error) {
    console.error('Error updating DB schema:', error);
  } finally {
    await connection.end();
  }
}

updateDB();
