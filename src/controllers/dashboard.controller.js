const pool = require('../config/db');

const getSummary = async (req, res) => {
  try {
    const [[ventasHoy]] = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const [[ventasMes]] = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const [[cantidadVentasHoy]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const [[cantidadVentasMes]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM ventas
      WHERE MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const [[stockTotal]] = await pool.query(`
      SELECT COALESCE(SUM(stock), 0) AS total
      FROM productos
      WHERE activo = 1
    `);

    const [[stockCritico]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM productos
      WHERE activo = 1 AND stock <= 10
    `);

    const [[ticketPromedioHoy]] = await pool.query(`
      SELECT COALESCE(AVG(total), 0) AS total
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const [[ticketPromedioMes]] = await pool.query(`
      SELECT COALESCE(AVG(total), 0) AS total
      FROM ventas
      WHERE MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
    `);

    const [salesByMethod] = await pool.query(`
      SELECT
        UPPER(COALESCE(metodo_pago, 'SIN_METODO')) AS metodo_pago,
        COUNT(*) AS cantidad,
        COALESCE(SUM(total), 0) AS monto
      FROM ventas
      WHERE MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
        AND UPPER(COALESCE(estado, 'PROCESADA')) <> 'CANCELADA'
      GROUP BY UPPER(COALESCE(metodo_pago, 'SIN_METODO'))
      ORDER BY monto DESC
      LIMIT 4
    `);

    const [topSellerMonth] = await pool.query(`
      SELECT
        u.id,
        u.nombre,
        COUNT(*) AS ventas,
        COALESCE(SUM(v.total), 0) AS monto
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE MONTH(v.fecha) = MONTH(CURDATE())
        AND YEAR(v.fecha) = YEAR(CURDATE())
        AND UPPER(COALESCE(v.estado, 'PROCESADA')) <> 'CANCELADA'
      GROUP BY u.id, u.nombre
      ORDER BY monto DESC, ventas DESC
      LIMIT 1
    `);

    const [recentSales] = await pool.query(`
      SELECT
        v.id,
        v.total,
        v.fecha,
        UPPER(COALESCE(v.estado, 'PROCESADA')) AS estado,
        IFNULL(c.nombre, 'CLIENTE GENÉRICO') AS cliente,
        u.nombre AS vendedor
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
      LIMIT 5
    `);

    const [criticalProducts] = await pool.query(`
      SELECT id, nombre, modelo_celular, stock
      FROM productos
      WHERE activo = 1 AND stock <= 10
      ORDER BY stock ASC, nombre ASC
      LIMIT 5
    `);

    res.status(200).json({
      totalVentasHoy: Number(ventasHoy.total) || 0,
      totalVentasMes: Number(ventasMes.total) || 0,
      cantidadVentasHoy: Number(cantidadVentasHoy.total) || 0,
      cantidadVentasMes: Number(cantidadVentasMes.total) || 0,
      ticketPromedioHoy: Number(ticketPromedioHoy.total) || 0,
      ticketPromedioMes: Number(ticketPromedioMes.total) || 0,
      totalCases: Number(stockTotal.total) || 0,
      stockCritico: Number(stockCritico.total) || 0,
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