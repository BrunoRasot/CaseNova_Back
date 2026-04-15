const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },

  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('=========================================================');
    console.log('CONEXIÓN EXITOSA: El ERP CaseNova está conectado a la DB');
    console.log('Hora del servidor:', res.rows[0].now);
    console.log('=========================================================');
  } catch (error) {
    console.error('=========================================================');
    console.error('ERROR DE CONEXIÓN EN CASENOVA:');
    console.error('Mensaje:', error.message);
    console.error('Consejo: Revisa que la URL en Render sea postgres:// y no postgresql://');
    console.error('=========================================================');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

testConnection();

module.exports = pool;