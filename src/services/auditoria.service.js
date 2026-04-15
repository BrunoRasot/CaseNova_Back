const pool = require('../config/db');

const registrarEventoAuditoria = async ({ usuarioId = null, accion = 'EVENTO', detalles = 'Sin detalle' }) => {
  try {
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
      [usuarioId, accion, detalles]
    );
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      if (accion === 'INICIO_SESION' && usuarioId) {
        try {
          await pool.query('INSERT INTO logs_acceso (usuario_id) VALUES (?)', [usuarioId]);
        } catch (_) {
        }
      }
      return;
    }
  }
};

module.exports = { registrarEventoAuditoria };
