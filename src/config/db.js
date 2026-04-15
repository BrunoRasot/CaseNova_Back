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
    console.log('---------------------------------------------------------');
    console.log('Conexión exitosa a la base de datos PostgreSQL (CaseNova)');
    console.log('Hora del servidor DB:', res.rows[0].now);
    console.log('---------------------------------------------------------');
  } catch (error) {
    console.error('---------------------------------------------------------');
    console.error('Error fatal al conectar con PostgreSQL:');
    console.error('Mensaje:', error.message);
    console.error('Asegúrate de que DATABASE_URL en Render tenga ?ssl=true');
    console.log('---------------------------------------------------------');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

testConnection();

module.exports = pool;