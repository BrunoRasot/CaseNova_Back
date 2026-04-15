const pool = require('../config/db');

const getReporteGeneral = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_ventas, 
        SUM(total) as ingresos_totales,
        AVG(total) as ticket_promedio
      FROM ventas 
      WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
      AND YEAR(fecha) = YEAR(CURRENT_DATE())
    `);

    const [mejoresProductos] = await pool.query(`
      SELECT p.nombre, p.modelo_celular, SUM(dv.cantidad) as vendidos
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      GROUP BY p.id
      ORDER BY vendidos DESC
      LIMIT 5
    `);

    const [metodosPago] = await pool.query(`
      SELECT metodo_pago, COUNT(*) as cantidad, SUM(total) as monto
      FROM ventas
      GROUP BY metodo_pago
    `);

    const [ventasVendedorDia] = await pool.query(`
      SELECT
        DATE(v.fecha) AS fecha,
        u.id AS vendedor_id,
        u.nombre AS vendedor,
        COUNT(*) AS total_ventas_dia,
        ROUND(SUM(v.total), 2) AS monto_ventas_dia
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      JOIN (
        SELECT venta_id, SUM(cantidad) AS total_cases
        FROM detalle_ventas
        GROUP BY venta_id
      ) dv_total ON dv_total.venta_id = v.id
      WHERE UPPER(COALESCE(v.estado, 'PROCESADA')) <> 'CANCELADA'
      GROUP BY DATE(v.fecha), u.id, u.nombre
      ORDER BY fecha DESC, total_ventas_dia DESC, vendedor ASC
    `);

    res.json({
      resumen: stats[0],
      topProductos: mejoresProductos,
      metodosPago,
      ventasVendedorDia
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al generar reportes' });
  }
};

module.exports = { getReporteGeneral };