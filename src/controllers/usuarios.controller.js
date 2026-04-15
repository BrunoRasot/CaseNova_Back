const pool = require('../config/db');
const { registrarEventoAuditoria } = require('../services/auditoria.service');

const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        nombre,
        email,
        rol,
        CASE WHEN activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS estado,
        ultimo_acceso
      FROM usuarios
      ORDER BY rol ASC, nombre ASC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

const updateEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const [target] = await pool.query('SELECT id, nombre FROM usuarios WHERE id = ? LIMIT 1', [id]);
    if (target.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const activo = estado === 'Activo' ? 1 : 0;
    await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id]);

    await registrarEventoAuditoria({
      usuarioId: req.user?.id || null,
      accion: 'USUARIO_ESTADO_ACTUALIZADO',
      detalles: `Usuario ${target[0].nombre} (id=${id}) actualizado a estado=${estado}`
    });

    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar estado' });
  }
};

const deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [target] = await pool.query('SELECT id, nombre FROM usuarios WHERE id = ? LIMIT 1', [id]);
    if (target.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const [ventas] = await pool.query('SELECT COUNT(*) AS total FROM ventas WHERE usuario_id = ?', [id]);
    if (Number(ventas?.[0]?.total) > 0) {
      await registrarEventoAuditoria({
        usuarioId: req.user?.id || null,
        accion: 'USUARIO_ELIMINACION_RECHAZADA',
        detalles: `No se elimino usuario ${target[0].nombre} (id=${id}) por ventas asociadas.`
      });
      return res.status(400).json({ message: 'No se puede eliminar: el usuario tiene ventas registradas.' });
    }

    // Mantiene el historico de accesos sin bloquear la eliminacion del usuario.
    try {
      await pool.query('UPDATE logs_acceso SET usuario_id = NULL WHERE usuario_id = ?', [id]);
    } catch (logsError) {
      if (logsError.code !== 'ER_NO_SUCH_TABLE') {
        throw logsError;
      }
    }

    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    const affectedRows = result?.affectedRows;

    if (!affectedRows) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    await registrarEventoAuditoria({
      usuarioId: req.user?.id || null,
      accion: 'USUARIO_ELIMINADO',
      detalles: `Usuario eliminado: ${target[0].nombre} (id=${id})`
    });

    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(409).json({ message: 'No se puede eliminar: el usuario tiene registros relacionados en el sistema.' });
    }
    console.error('DELETE_USER_ERROR:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

module.exports = { getUsuarios, updateEstadoUsuario, deleteUsuario };