const pool = require('../config/db');

const registrarEventoAuditoria = async ({ usuarioId = null, accion = 'EVENTO', detalles = 'Sin detalle' }) => {
  try {
    console.log(`AUDITORIA: intentando registrar evento -> accion=${accion} usuarioId=${usuarioId}`);
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
      [usuarioId, accion, detalles]
    );
    console.log('AUDITORIA: evento registrado en tabla auditoria');
  } catch (error) {
    // Postgres undefined table error code is '42P01'
    if (error && error.code === '42P01') {
      if (accion === 'INICIO_SESION' && usuarioId) {
        try {
          await pool.query('INSERT INTO logs_acceso (usuario_id) VALUES ($1)', [usuarioId]);
        } catch (err) {
          // ignore secondary error when fallback table missing or incompatible
        }
      }
      return;
    }

    // Log unexpected errors for easier debugging
    console.error('Error registrando evento de auditoría:', error.message || error, 'accion=', accion, 'usuarioId=', usuarioId);
  }
};

module.exports = { registrarEventoAuditoria };
