const { registrarEventoAuditoria } = require('../services/auditoria.service');

const auditoriaMiddleware = async (req, res, next) => {
  const metodosAuditables = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (!metodosAuditables.includes(req.method)) {
    return next();
  }

  const originalJson = res.json;

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const usuarioId = req.user?.id || req.usuario?.id || null;
      const recurso = req.baseUrl.split('/').pop().toUpperCase() || 'SISTEMA';
      const accion = `${req.method}_${recurso}`;
      const detalles = `Ruta: ${req.originalUrl} | Datos: ${JSON.stringify(req.body)}`;
      registrarEventoAuditoria({
        usuarioId,
        accion,
        detalles
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = auditoriaMiddleware;