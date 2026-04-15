const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) return res.status(403).json({ message: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const userRole = String(req.user?.rol || '').toUpperCase();

  if (!allowedRoles.length || allowedRoles.includes(userRole)) {
    return next();
  }

  return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
};

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.authorizeRoles = authorizeRoles;