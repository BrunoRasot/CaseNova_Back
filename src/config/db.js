const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos MySQL (CaseNova)');
    connection.release();
  } catch (error) {
    console.error('❌ Error fatal al conectar con la base de datos:');
    console.error(error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;