const pool = require('../config/db');

const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE activo = 1 ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

const getStockCritico = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, marca_celular, modelo_celular, stock, stock_minimo, precio_venta 
      FROM productos 
      WHERE activo = 1 AND stock <= stock_minimo 
      ORDER BY stock ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('ERROR_STOCK_CRITICO:', error);
    res.status(500).json({ message: 'Error al obtener alertas de inventario' });
  }
};

const createProducto = async (req, res) => {
  const { nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo, material, color } = req.body;
  const imagen = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    if (!nombre || !marca_celular || !modelo_celular || !precio_venta || stock === undefined) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    await pool.query(
      'INSERT INTO productos (nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo, material, color, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo || 5, material || null, color || null, imagen]
    );
    res.status(201).json({ message: 'Producto registrado' });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al registrar producto' });
  }
};

const updateStock = async (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;
  try {
    await pool.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, id]);
    res.json({ message: 'Stock actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar stock' });
  }
};

const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo, material, color } = req.body;
  const imagen = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    if (!nombre || !marca_celular || !modelo_celular || !precio_venta || stock === undefined) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    let query = 'UPDATE productos SET nombre = ?, marca_celular = ?, modelo_celular = ?, precio_venta = ?, stock = ?, stock_minimo = ?, material = ?, color = ?';
    let params = [nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo || 5, material || null, color || null];

    if (imagen) {
      query += ', imagen = ?';
      params.push(imagen);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

const deleteProducto = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

module.exports = { 
  getProductos, 
  getStockCritico,
  createProducto, 
  updateStock, 
  updateProducto, 
  deleteProducto 
};