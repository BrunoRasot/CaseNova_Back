const pool = require('../src/config/db');

const check = async () => {
  try {
    console.log('Comprobando existencia de tablas relacionadas con auditoría...');

    const { rows: hasAuditoria } = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auditoria'
    `);

    console.log('auditoria table exists:', hasAuditoria.length > 0);

    if (hasAuditoria.length > 0) {
      const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS total FROM auditoria');
      console.log('auditoria count:', countRows[0].total);
    }

    const { rows: hasLogsAcceso } = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logs_acceso'
    `);

    console.log('logs_acceso table exists:', hasLogsAcceso.length > 0);

    if (hasLogsAcceso.length > 0) {
      const { rows: countLogs } = await pool.query('SELECT COUNT(*)::int AS total FROM logs_acceso');
      console.log('logs_acceso count:', countLogs[0].total);

      const { rows: sample } = await pool.query('SELECT * FROM logs_acceso ORDER BY 1 DESC LIMIT 5');
      console.log('logs_acceso sample rows:', sample);
    }

    // Show last 5 auditoria rows if exists
    if (hasAuditoria.length > 0) {
      const { rows: recent } = await pool.query(`
        SELECT a.id, a.usuario_id, a.accion, a.detalles, a.fecha
        FROM auditoria a
        ORDER BY a.fecha DESC
        LIMIT 5
      `);
      console.log('recent auditoria rows:', recent);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error comprobando auditoría:', error);
    process.exit(2);
  }
};

check();
