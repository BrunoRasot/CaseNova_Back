const pool = require('../config/db');

const getLogs = async (req, res) => {
  try {
    const query = `
      SELECT
        a.id,
        COALESCE(u.nombre, 'Sistema/Desconocido') AS usuario,
        COALESCE(u.rol, 'N/A') AS rol,
        a.accion,
        a.detalles,
        a.ip_address,
        TO_CHAR(a.fecha, 'DD/MM/YYYY HH24:MI:SS') AS fecha_formateada
      FROM auditoria a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY a.fecha DESC
      LIMIT 150
    `;

    const { rows } = await pool.query(query);

    res.json(rows);
    
  } catch (error) {
    console.error("❌ ERROR EN AUDITORIA_CONTROLLER:", error.message);
    res.status(500).json({ 
      message: 'Error al obtener los registros de auditoría',
      error: process.env.NODE_ENV === 'development' ? error.message : {} 
    });
  }
};

const registrarLog = async (usuario_id, accion, detalles, ip_address = null) => {
  try {
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles, ip_address) VALUES ($1, $2, $3, $4)',
      [usuario_id, accion, detalles, ip_address]
    );
  } catch (error) {
    console.error("No se pudo registrar el log de auditoría:", error.message);
  }
};

module.exports = { getLogs, registrarLog };