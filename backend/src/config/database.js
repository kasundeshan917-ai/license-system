const { Pool } = require('pg');
require('dotenv').config();

// Simple connection config
const pool = new Pool({
    user: 'postgres',
    password: 'YourNewPassword123!',
    host: '127.0.0.1',  // localhost වෙනුවට 127.0.0.1
    port: 5432,
    database: 'license_db',
    connectionTimeoutMillis: 10000,
});

// Test connection immediately
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to PostgreSQL');
    release();
});

module.exports = pool;