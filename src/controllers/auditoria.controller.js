const pool = require('../config/db');

const getLogs = async (req, res) => {
  try {
    const [hasAuditoria] = await pool.query("SHOW TABLES LIKE 'auditoria'");

    if (hasAuditoria.length > 0) {
      const [rows] = await pool.query(`
        SELECT
          a.id,
          u.nombre AS usuario,
          u.rol,
          COALESCE(a.accion, 'EVENTO') AS accion,
          COALESCE(a.detalles, 'Sin detalle') AS detalles,
          DATE_FORMAT(a.fecha, '%d/%m/%Y %H:%i:%s') AS fecha_formateada
        FROM auditoria a
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        ORDER BY a.fecha DESC
        LIMIT 100
      `);

      return res.json(rows);
    }

    const [hasLogsAcceso] = await pool.query("SHOW TABLES LIKE 'logs_acceso'");

    if (hasLogsAcceso.length === 0) {
      return res.json([]);
    }

    const [columns] = await pool.query('SHOW COLUMNS FROM logs_acceso');
    const colNames = columns.map((c) => c.Field);

    const idCol = colNames.includes('id') ? 'l.id' : '0';
    const userCol = colNames.includes('usuario_id') ? 'l.usuario_id' : 'NULL';
    const dateCol = colNames.includes('fecha')
      ? 'l.fecha'
      : colNames.includes('created_at')
        ? 'l.created_at'
        : colNames.includes('timestamp')
          ? 'l.timestamp'
          : 'NOW()';

    const [rows] = await pool.query(`
      SELECT
        ${idCol} AS id,
        u.nombre AS usuario,
        u.rol,
        'INICIO_SESION' AS accion,
        'Acceso registrado en el sistema' AS detalles,
        DATE_FORMAT(${dateCol}, '%d/%m/%Y %H:%i:%s') AS fecha_formateada
      FROM logs_acceso l
      LEFT JOIN usuarios u ON ${userCol} = u.id
      ORDER BY ${dateCol} DESC
      LIMIT 100
    `);

    return res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar logs de auditoría' });
  }
};

module.exports = { getLogs };