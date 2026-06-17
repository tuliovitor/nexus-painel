const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

var dbConfig;

if (process.env.DATABASE_URL) {
  // Railway / Planetscale: mysql://user:pass@host:port/database
  dbConfig = { uri: process.env.DATABASE_URL };
} else {
  dbConfig = {
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'nexus_painel'
  };
}

const pool = mysql.createPool(Object.assign(dbConfig, {
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
}));

module.exports = pool;
