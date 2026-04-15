const pool = require('../config/db');

const getSummary = async (req, res) => {
  try {
    const { rows: [ventasHoy] } = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const { rows: [ventasMes] } = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const { rows: [cantidadVentasHoy] } = await pool.query(`
      SELECT COUNT(*) AS total
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const { rows: [cantidadVentasMes] } = await pool.query(`
      SELECT COUNT(*) AS total
      FROM ventas
      WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const { rows: [stockTotal] } = await pool.query(`
      SELECT COALESCE(SUM(stock), 0) AS total
      FROM productos
      WHERE activo = true
    `);

    const { rows: [stockCritico] } = await pool.query(`
      SELECT COUNT(*) AS total
      FROM productos
      WHERE activo = true AND stock <= 10
    `);

    const { rows: [ticketPromedioHoy] } = await pool.query(`
      SELECT COALESCE(AVG(total), 0) AS total
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const { rows: [ticketPromedioMes] } = await pool.query(`
      SELECT COALESCE(AVG(total), 0) AS total
      FROM ventas
      WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const { rows: salesByMethod } = await pool.query(`
      SELECT
        UPPER(COALESCE(metodo_pago::text, 'SIN_METODO')) AS metodo_pago,
        COUNT(*) AS cantidad,
        COALESCE(SUM(total), 0) AS monto
      FROM ventas
      WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
      GROUP BY UPPER(COALESCE(metodo_pago::text, 'SIN_METODO'))
      ORDER BY monto DESC
      LIMIT 4
    `);

    const { rows: topSellerMonth } = await pool.query(`
      SELECT
        u.id,
        u.nombre,
        COUNT(*) AS ventas,
        COALESCE(SUM(v.total), 0) AS monto
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE EXTRACT(MONTH FROM v.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM v.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND UPPER(COALESCE(v.estado, 'PROCESADA')) <> 'CANCELADA'
      GROUP BY u.id, u.nombre
      ORDER BY monto DESC, ventas DESC
      LIMIT 1
    `);

    const { rows: recentSales } = await pool.query(`
      SELECT
        v.id,
        v.total,
        v.fecha,
        UPPER(COALESCE(v.estado, 'PROCESADA')) AS estado,
        COALESCE(c.nombre, 'CLIENTE GENÉRICO') AS cliente,
        u.nombre AS vendedor
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
      LIMIT 5
    `);

    const { rows: criticalProducts } = await pool.query(`
      SELECT id, nombre, modelo_celular, stock
      FROM productos
      WHERE activo = true AND stock <= 10
      ORDER BY stock ASC, nombre ASC
      LIMIT 5
    `);

    res.status(200).json({
      totalVentasHoy: Number(ventasHoy?.total) || 0,
      totalVentasMes: Number(ventasMes?.total) || 0,
      cantidadVentasHoy: Number(cantidadVentasHoy?.total) || 0,
      cantidadVentasMes: Number(cantidadVentasMes?.total) || 0,
      ticketPromedioHoy: Number(ticketPromedioHoy?.total) || 0,
      ticketPromedioMes: Number(ticketPromedioMes?.total) || 0,
      totalCases: Number(stockTotal?.total) || 0,
      stockCritico: Number(stockCritico?.total) || 0,
      salesByMethod,
      topSellerMonth: topSellerMonth?.[0] || null,
      recentSales,
      criticalProducts,
    });
  } catch (error) {
    console.error('Error al cargar resumen del dashboard:', error);
    res.status(500).json({ message: 'Error al cargar resumen' });
  }
};

module.exports = { getSummary };