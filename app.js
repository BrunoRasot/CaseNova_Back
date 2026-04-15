require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const pool = require('./src/config/db');

const authRoutes = require('./src/routes/auth.routes');
const productosRoutes = require('./src/routes/productos.routes');
const ventasRoutes = require('./src/routes/ventas.routes');
const clientesRoutes = require('./src/routes/clientes.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const reportesRoutes = require('./src/routes/reportes.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');
const auditoriaRoutes = require('./src/routes/auditoria.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  'https://casenova-erp.onrender.com',
  'http://localhost:5173'
];

app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS, "https://casenova-back.onrender.com"]
    }
  }
}));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log("CORS Bloqueado para el origen:", origin);
      callback(new Error('Origen no permitido por la política CORS de CaseNova'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(cookieParser());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada en el servidor de CaseNova' });
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('ERROR CRÍTICO: No se pudo conectar a PostgreSQL', err.stack);
    process.exit(1);
  } else {
    app.listen(PORT, () => {
      console.log(`
      CASENOVA ERP - SISTEMA ACTIVO
      ---------------------------------
      Puerto: ${PORT}
      Base de Datos: PostgreSQL Conectada
      Modo: ${process.env.NODE_ENV || 'production'}
      ---------------------------------
      `);
    });
  }
});