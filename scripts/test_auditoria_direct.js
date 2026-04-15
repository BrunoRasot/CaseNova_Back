const { registrarEventoAuditoria } = require('../src/services/auditoria.service');
const pool = require('../src/config/db');

const run = async () => {
  try {
    console.log('Llamando registrarEventoAuditoria desde script de prueba...');
    await registrarEventoAuditoria({ usuarioId: null, accion: 'TEST_SCRIPT', detalles: 'Prueba directa' });

    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM auditoria');
    console.log('auditoria count after insert:', rows[0].total);

    const { rows: recent } = await pool.query('SELECT id, usuario_id, accion, detalles, fecha FROM auditoria ORDER BY fecha DESC LIMIT 5');
    console.log('recent auditoria rows:', recent);

    process.exit(0);
  } catch (error) {
    console.error('ERROR test_auditoria_direct:', error);
    process.exit(2);
  }
};

run();
