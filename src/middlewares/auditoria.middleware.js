const { registrarLog } = require('../controllers/auditoria.controller');

const auditoriaMiddleware = async (req, res, next) => {
  const metodosAuditables = ['POST', 'PUT', 'DELETE', 'PATCH'];

  // 1. Si no es una acción de cambio, ignoramos
  if (!metodosAuditables.includes(req.method)) {
    return next();
  }

  const originalJson = res.json;

  res.json = function (data) {
    // 2. Solo auditamos si la respuesta fue exitosa
    if (res.statusCode >= 200 && res.statusCode < 300) {
      
      // 3. INTENTO DE CAPTURAR EL ID (revisamos varias opciones comunes)
      const usuarioId = req.user?.id || req.usuario?.id || req.session?.userId || null;
      
      // 4. Formateamos la acción para que se vea bien en tu tabla
      const recurso = req.baseUrl.split('/').pop().toUpperCase();
      const accion = `${req.method}_${recurso}`; 
      
      const detalles = `Ruta: ${req.originalUrl} | Datos: ${JSON.stringify(req.body)}`;
      
      // 5. Enviamos a la DB (req.ip captura la IP automáticamente)
      registrarLog(usuarioId, accion, detalles, req.ip);
    }
    
    return originalJson.call(this, data);
  };

  next();
};

module.exports = auditoriaMiddleware;