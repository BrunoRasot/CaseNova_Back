const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registrarEventoAuditoria } = require('../services/auditoria.service');

const normalizeText = (value = '') => String(value).trim();
const normalizeEmail = (value = '') => normalizeText(value).toLowerCase();
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const getPepper = () => process.env.BCRYPT_PEPPER || '';

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(`${password}${getPepper()}`, salt);
};

const comparePassword = async (password, hashedPassword) => bcrypt.compare(`${password}${getPepper()}`, hashedPassword);

const compareLegacyPassword = async (password, hashedPassword) => bcrypt.compare(password, hashedPassword);

const signAccessToken = (user) => jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

const signRefreshToken = (user) => jwt.sign({ id: user.id, tokenType: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth'
  });
};

const isLocked = (user) => {
  if (!user.locked_until) return false;
  return new Date(user.locked_until).getTime() > Date.now();
};

const getClientIp = (req) => req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP_DESCONOCIDA';
const isMissingColumnError = (error) => error?.code === '42703';

const runSafeQuery = async (query, params = []) => {
  try {
    return await pool.query(query, params);
  } catch (error) {
    if (isMissingColumnError(error)) {
      return null;
    }
    throw error;
  }
};

const resetFailedAttempts = async (userId) => {
  await runSafeQuery('UPDATE usuarios SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [userId]);
};

const registerFailedAttempt = async (userId) => {
  const result = await runSafeQuery('SELECT failed_login_attempts FROM usuarios WHERE id = $1 LIMIT 1', [userId]);
  if (!result || !result.rows) {
    return false;
  }

  const currentAttempts = Number(result.rows[0]?.failed_login_attempts || 0) + 1;
  if (currentAttempts >= LOCK_THRESHOLD) {
    await runSafeQuery(
      `UPDATE usuarios SET failed_login_attempts = $1, locked_until = NOW() + $2 * INTERVAL '1 minute' WHERE id = $3`,
      [currentAttempts, LOCK_MINUTES, userId]
    );
    return true;
  }

  await runSafeQuery('UPDATE usuarios SET failed_login_attempts = $1 WHERE id = $2', [currentAttempts, userId]);
  return false;
};

const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const ip = getClientIp(req);

    if (!email || !password) {
      await registrarEventoAuditoria({ accion: 'LOGIN_INVALIDO', detalles: `Intento con campos incompletos. email=${email || 'N/A'} ip=${ip}` });
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
    }
    
    const { rows: users } = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(TRIM(email)) = $1 LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      await registrarEventoAuditoria({ accion: 'LOGIN_FALLIDO', detalles: `Usuario no encontrado. email=${email} ip=${ip}` });
      return res.status(401).json({ message: 'Credenciales no reconocidas' });
    }

    const user = users[0];

    if (!user.password || typeof user.password !== 'string') {
      await registrarEventoAuditoria({ usuarioId: user.id, accion: 'LOGIN_FALLIDO', detalles: `Hash invalido. email=${email} ip=${ip}` });
      return res.status(401).json({ message: 'Credenciales no reconocidas' });
    }

    if (isLocked(user)) {
      await registrarEventoAuditoria({ usuarioId: user.id, accion: 'LOGIN_BLOQUEADO', detalles: `Bloqueado. email=${email} ip=${ip}` });
      return res.status(423).json({ message: 'Tu cuenta está bloqueada temporalmente por múltiples intentos fallidos. Intenta más tarde.' });
    }

    let isMatch = false;
    let shouldMigratePassword = false;

    try { isMatch = await comparePassword(password, user.password); } catch (_) { isMatch = false; }

    if (!isMatch) {
      try {
        isMatch = await compareLegacyPassword(password, user.password);
        shouldMigratePassword = isMatch;
      } catch (_) { isMatch = false; }
    }

    if (!isMatch) {
      const wasLocked = await registerFailedAttempt(user.id);
      await registrarEventoAuditoria({ usuarioId: user.id, accion: 'LOGIN_FALLIDO', detalles: `Pass incorrecta. email=${email} ip=${ip}` });
      return res.status(wasLocked ? 423 : 401).json({
        message: wasLocked ? 'Tu cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos.' : 'Credenciales no reconocidas'
      });
    }

    if (shouldMigratePassword && getPepper()) {
      const migratedHash = await hashPassword(password);
      await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [migratedHash, user.id]);
    }

    await resetFailedAttempts(user.id);

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const refreshTokenHash = await hashPassword(refreshToken);

    await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [user.id]);
    await runSafeQuery(
      `UPDATE usuarios SET refresh_token_hash = $1, refresh_token_expires_at = NOW() + INTERVAL '7 days' WHERE id = $2`,
      [refreshTokenHash, user.id]
    );

    await registrarEventoAuditoria({ usuarioId: user.id, accion: 'INICIO_SESION', detalles: `Login exitoso. ip=${ip}` });
    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      user: { id: user.id, nombre: user.nombre, rol: user.rol, email: user.email },
      token
    });

  } catch (error) {
    console.error('AUTH_LOGIN_ERROR:', error);
    res.status(500).json({ message: 'Fallo crítico en el servicio de autenticación' });
  }
};

const register = async (req, res) => {
  try {
    const nombre = normalizeText(req.body?.nombre);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const rol = normalizeText(req.body?.rol) || 'VENDEDOR';
    const actorId = req.user?.id || null;

    const allowedRoles = ['ADMINISTRADOR', 'VENDEDOR'];
    const normalizedRole = allowedRoles.includes(String(rol).toUpperCase()) ? String(rol).toUpperCase() : 'VENDEDOR';

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, correo y contraseña son obligatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    
    const { rows: exists } = await pool.query(
      `SELECT id, nombre, email
       FROM usuarios
       WHERE LOWER(TRIM(email)) = $1
          OR LOWER(TRIM(nombre)) = LOWER(TRIM($2))
       LIMIT 1`,
      [email, nombre]
    );

    if (exists.length > 0) {
      const duplicated = exists[0];
      const sameEmail = normalizeEmail(duplicated.email) === email;
      return res.status(400).json({
        message: sameEmail ? 'El correo ya está registrado en el sistema.' : 'Ya existe un usuario con ese nombre.'
      });
    }

    const hashedPassword = await hashPassword(password);
    const { rows: newUsers } = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES ($1, $2, $3, $4, TRUE) RETURNING id', 
      [nombre, email, hashedPassword, normalizedRole]
    );

    const newUserId = newUsers[0].id;

    await registrarEventoAuditoria({
      usuarioId: actorId,
      accion: 'USUARIO_REGISTRADO',
      detalles: `Usuario creado: id=${newUserId} nombre=${nombre} rol=${normalizedRole}`
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente', id: newUserId });
  } catch (error) {
    console.error('AUTH_REGISTER_ERROR:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El usuario o correo ya existe.' });
    }
    res.status(500).json({ message: 'Error al procesar el registro de usuario' });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token requerido.' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const { rows: users } = await pool.query('SELECT * FROM usuarios WHERE id = $1 LIMIT 1', [decoded.id]);

    if (users.length === 0) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Sesión inválida.' });
    }

    const user = users[0];
    if (isLocked(user)) {
      clearRefreshCookie(res);
      return res.status(403).json({ message: 'La cuenta no está habilitada.' });
    }

    const storedHash = user.refresh_token_hash;
    const matches = storedHash ? await comparePassword(refreshToken, storedHash) : false;

    if (!matches) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Sesión inválida.' });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    const newRefreshTokenHash = await hashPassword(newRefreshToken);

    await runSafeQuery(
      `UPDATE usuarios SET refresh_token_hash = $1, refresh_token_expires_at = NOW() + INTERVAL '7 days' WHERE id = $2`,
      [newRefreshTokenHash, user.id]
    );

    setRefreshCookie(res, newRefreshToken);

    res.json({ token: newAccessToken, user: { id: user.id, nombre: user.nombre, rol: user.rol, email: user.email }});
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Sesión expirada o inválida.' });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        await runSafeQuery('UPDATE usuarios SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE id = $1', [decoded.id]);
      } catch (_) {}
    }

    clearRefreshCookie(res);
    return res.json({ message: 'Sesión cerrada correctamente.' });
  } catch (error) {
    clearRefreshCookie(res);
    return res.json({ message: 'Sesión cerrada correctamente.' });
  }
};

module.exports = { login, register, refresh, logout };