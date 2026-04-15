const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexión exitosa a la base de datos PostgreSQL (CaseNova)');
    console.log('Hora del servidor DB:', res.rows[0].now);
  } catch (error) {
    console.error('Error fatal al conectar con PostgreSQL:');
    console.error(error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;