require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cookieParser = require('cookie-parser');
// Importamos el pool de conexión que crearemos en el siguiente paso
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
// Render asigna puertos dinámicos arriba del 10000, esto lo maneja perfecto
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

// Configuración de Seguridad
app.use(helmet({
  crossOriginResourcePolicy: false,
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS] // Permite comunicación con el front
    }
  }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por la política CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Archivos Estáticos
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Rutas
app.use('/api/auth', authRoutes); // Moví el limiter al router si prefieres, o déjalo aquí
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

// Verificación de conexión a la DB antes de encender el servidor
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ ERROR CRÍTICO: No se pudo conectar a PostgreSQL', err.stack);
    process.exit(1); // Detiene la app si no hay base de datos
  } else {
    app.listen(PORT, () => {
      console.log(`
      ✅ CASENOVA ERP - SISTEMA ACTIVO
      ---------------------------------
      Puerto: ${PORT}
      Base de Datos: PostgreSQL Conectada
      Modo: ${process.env.NODE_ENV || 'development'}
      ---------------------------------
      `);
    });
  }
});