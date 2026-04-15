const pool = require('../config/db');

const registrarEventoAuditoria = async ({ usuarioId = null, accion = 'EVENTO', detalles = 'Sin detalle' }) => {
  try {
    const idParaInsertar = (usuarioId && !isNaN(usuarioId)) ? usuarioId : null;

    console.log(`DB_AUDIT: Intentando registrar -> [${accion}] para UserID: ${idParaInsertar}`);

    const query = 'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)';
    const values = [idParaInsertar, accion, detalles];

    await pool.query(query, values);

    console.log('DB_AUDIT: Registro guardado exitosamente.');
  } catch (error) {
    if (error.code === '23503') {
      console.warn('DB_AUDIT: El usuarioId no existe. Reintentando como evento de SISTEMA (NULL)...');
      try {
        await pool.query(
          'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
          [null, accion, `(Usuario original no encontrado) - ${detalles}`]
        );
      } catch (innerError) {
        console.error('DB_AUDIT: Error crítico incluso con NULL:', innerError.message);
      }
    } else {
      console.error('DB_AUDIT: Error inesperado:', error.message);
    }
  }
};

module.exports = { registrarEventoAuditoria };