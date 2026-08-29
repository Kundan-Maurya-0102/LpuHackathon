require('dotenv').config();
const app = require('./app');
const env = require('./src/config/env');
const db = require('./src/config/database');

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Test DB connection
    const connection = await db.getConnection();
    console.log('✅ Connected to MySQL Database');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
