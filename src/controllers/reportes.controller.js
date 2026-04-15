const pool = require('../config/db');

const getReporteGeneral = async (req, res) => {
  try {
    const { rows: [resumen] } = await pool.query(`
      SELECT 
        COUNT(*) as total_ventas, 
        COALESCE(SUM(total), 0) as ingresos_totales,
        COALESCE(AVG(total), 0) as ticket_promedio
      FROM ventas 
      WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE) 
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const { rows: mejoresProductos } = await pool.query(`
      SELECT p.nombre, p.modelo_celular, SUM(dv.cantidad) as vendidos
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      GROUP BY p.id, p.nombre, p.modelo_celular
      ORDER BY vendidos DESC
      LIMIT 5
    `);

    const { rows: metodosPago } = await pool.query(`
      SELECT UPPER(COALESCE(metodo_pago::text, 'SIN_METODO')) as metodo_pago, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as monto
      FROM ventas
      WHERE UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
      GROUP BY UPPER(COALESCE(metodo_pago::text, 'SIN_METODO'))
    `);

    const { rows: ventasVendedorDia } = await pool.query(`
      SELECT
        DATE(v.fecha) AS fecha,
        u.id AS vendedor_id,
        u.nombre AS vendedor,
        COUNT(*) AS total_ventas_dia,
        ROUND(SUM(v.total)::numeric, 2) AS monto_ventas_dia
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
      resumen: {
        total_ventas: Number(resumen?.total_ventas) || 0,
        ingresos_totales: Number(resumen?.ingresos_totales) || 0,
        ticket_promedio: Number(resumen?.ticket_promedio) || 0
      },
      topProductos: mejoresProductos.map(p => ({ ...p, vendidos: Number(p.vendidos) })),
      metodosPago: metodosPago.map(m => ({ ...m, monto: Number(m.monto), cantidad: Number(m.cantidad) })),
      ventasVendedorDia: ventasVendedorDia.map(v => ({ 
        ...v, 
        total_ventas_dia: Number(v.total_ventas_dia), 
        monto_ventas_dia: Number(v.monto_ventas_dia) 
      }))
    });
  } catch (error) {
    console.error('ERROR_GET_REPORTES:', error);
    res.status(500).json({ message: 'Error al generar reportes' });
  }
};

module.exports = { getReporteGeneral };