const pool = require('../config/db');

const getLogs = async (req, res) => {
  try {
    const { rows: hasAuditoria } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'auditoria'
    `);

    if (hasAuditoria.length > 0) {
      const { rows } = await pool.query(`
        SELECT
          a.id,
          u.nombre AS usuario,
          u.rol,
          COALESCE(a.accion, 'EVENTO') AS accion,
          COALESCE(a.detalles, 'Sin detalle') AS detalles,
          TO_CHAR(a.fecha, 'DD/MM/YYYY HH24:MI:SS') AS fecha_formateada
        FROM auditoria a
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        ORDER BY a.fecha DESC
        LIMIT 100
      `);

      return res.json(rows);
    }

    const { rows: hasLogsAcceso } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'logs_acceso'
    `);

    if (hasLogsAcceso.length === 0) {
      return res.json([]);
    }

    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'logs_acceso'
    `);
    
    const colNames = columns.map((c) => c.column_name);

    const idCol = colNames.includes('id') ? 'l.id' : '0';
    const userCol = colNames.includes('usuario_id') ? 'l.usuario_id' : 'NULL';
    
    const dateCol = colNames.includes('fecha_ingreso')
      ? 'l.fecha_ingreso'
      : colNames.includes('fecha')
        ? 'l.fecha'
        : colNames.includes('created_at')
          ? 'l.created_at'
          : colNames.includes('timestamp')
            ? 'l.timestamp'
            : 'NOW()';

    const { rows } = await pool.query(`
      SELECT
        ${idCol} AS id,
        u.nombre AS usuario,
        u.rol,
        'INICIO_SESION' AS accion,
        'Acceso registrado en el sistema' AS detalles,
        TO_CHAR(${dateCol}, 'DD/MM/YYYY HH24:MI:SS') AS fecha_formateada
      FROM logs_acceso l
      LEFT JOIN usuarios u ON ${userCol} = u.id
      ORDER BY ${dateCol} DESC
      LIMIT 100
    `);

    return res.json(rows);
  } catch (error) {
    console.error("ERROR EN GET LOGS:", error);
    res.status(500).json({ message: 'Error al consultar logs de auditoría' });
  }
};

module.exports = { getLogs };