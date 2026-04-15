const pool = require('../config/db');

const registrarVenta = async (req, res) => {
  const { total, metodo_pago, productos, cliente_id, codigo_comprobante, marca_tarjeta } = req.body;
  const usuario_id = req.user.id;

  const client = await pool.connect();

  const metodosConComprobante = ['YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];
  const metodoUpper = String(metodo_pago || '').toUpperCase();

  if (metodosConComprobante.includes(metodoUpper) && !String(codigo_comprobante || '').trim()) {
    client.release();
    return res.status(400).json({ success: false, message: 'El código de comprobante es obligatorio para este método de pago' });
  }

  if (metodoUpper === 'TARJETA' && !String(marca_tarjeta || '').trim()) {
    client.release();
    return res.status(400).json({ success: false, message: 'La marca de tarjeta es obligatoria para pagos con tarjeta' });
  }

  try {
    await client.query('BEGIN');

    const { rows: resultVenta } = await client.query(
      `INSERT INTO ventas (usuario_id, cliente_id, total, metodo_pago, codigo_comprobante, marca_tarjeta) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        usuario_id,
        cliente_id || null,
        total,
        metodo_pago,
        String(codigo_comprobante || '').trim() || null,
        metodoUpper === 'TARJETA' ? String(marca_tarjeta || '').trim().toUpperCase() : null
      ]
    );

    const venta_id = resultVenta[0].id;

    for (const prod of productos) {
      const { rows: stockCheck } = await client.query(
        'SELECT stock FROM productos WHERE id = $1 FOR UPDATE',
        [prod.id]
      );

      if (stockCheck[0].stock < prod.cantidad) {
        throw new Error(`Stock insuficiente para el producto ID: ${prod.id}`);
      }

      await client.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [venta_id, prod.id, prod.cantidad, prod.precio_venta, (prod.cantidad * prod.precio_venta)]
      );

      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [prod.cantidad, prod.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Venta procesada', venta_id });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('ERROR_REGISTRAR_VENTA:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al procesar la venta' });
  } finally {
    client.release();
  }
};

const getHistorialVentas = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT v.id, v.total, v.metodo_pago, v.fecha, 
             v.estado, v.motivo_estado, v.codigo_comprobante, v.marca_tarjeta,
             u.nombre as vendedor, 
             COALESCE(c.nombre, 'CLIENTE GENÉRICO') as cliente,
             c.dni_ruc as cliente_documento
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('ERROR_GET_HISTORIAL:', error);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
};

const actualizarEstadoVenta = async (req, res) => {
  const { id } = req.params;
  const { estado, motivo } = req.body;

  const estadoFinal = String(estado || '').toUpperCase();
  if (!['CANCELADA', 'NCR'].includes(estadoFinal)) {
    return res.status(400).json({ message: 'Estado no válido' });
  }

  if (!motivo || !String(motivo).trim()) {
    return res.status(400).json({ message: 'El motivo es obligatorio' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: ventaRows } = await client.query('SELECT id, estado FROM ventas WHERE id = $1 FOR UPDATE', [id]);
    if (!ventaRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    const estadoActual = (ventaRows[0].estado || 'PROCESADA').toUpperCase();
    if (estadoActual !== 'PROCESADA') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'La venta ya fue procesada como CANCELADA/NCR' });
    }

    const { rows: detalles } = await client.query(
      'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = $1',
      [id]
    );

    for (const item of detalles) {
      await client.query(
        'UPDATE productos SET stock = stock + $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );
    }

    await client.query(
      'UPDATE ventas SET estado = $1, motivo_estado = $2, fecha_estado = NOW() WHERE id = $3',
      [estadoFinal, String(motivo).trim(), id]
    );

    await client.query('COMMIT');
    return res.json({ message: `Venta marcada como ${estadoFinal}`, estado: estadoFinal, motivo_estado: String(motivo).trim() });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('ERROR_ACTUALIZAR_ESTADO_VENTA:', error);
    return res.status(500).json({ message: 'Error al actualizar el estado de la venta' });
  } finally {
    client.release();
  }
};

const getDetalleVenta = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT dv.*, p.nombre as producto_nombre, p.modelo_celular
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = $1
    `, [id]);
    res.json(rows);
  } catch (error) {
    console.error('ERROR_GET_DETALLE_VENTA:', error);
    res.status(500).json({ message: 'Error al obtener el detalle' });
  }
};

module.exports = { registrarVenta, getHistorialVentas, getDetalleVenta, actualizarEstadoVenta };