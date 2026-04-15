const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { login, register, refresh, logout } = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validateRequest');
const { loginSchema, registerSchema } = require('../validators/auth.schemas');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Demasiados intentos de acceso. Intente en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

router.use(cookieParser());

router.post('/register', verifyToken, authorizeRoles('ADMINISTRADOR'), validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/verify', verifyToken, (req, res) => {
    res.status(200).json({
        valid: true,
        message: 'Sesión activa'
    });
});

module.exports = router;