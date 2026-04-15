const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  ssl: isProduction 
    ? { rejectUnauthorized: false } 
    : false,

  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('=========================================================');
    console.log(`CONEXIÓN EXITOSA: CaseNova conectado a la DB (${isProduction ? 'NUBE' : 'LOCAL'})`);
    console.log('Hora del servidor:', res.rows[0].now);
    console.log('=========================================================');
  } catch (error) {
    console.error('=========================================================');
    console.error('ERROR DE CONEXIÓN EN CASENOVA:');
    console.error('Mensaje:', error.message);
    console.error('=========================================================');
    
    if (isProduction) {
      process.exit(1);
    }
  }
};

testConnection();

module.exports = pool;