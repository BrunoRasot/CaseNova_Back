const pool = require('../config/db');

const getProductos = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM productos WHERE activo = true ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('ERROR_GET_PRODUCTOS:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

const getStockCritico = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, nombre, marca_celular, modelo_celular, stock, stock_minimo, precio_venta 
      FROM productos 
      WHERE activo = true AND stock <= stock_minimo 
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
  
  // ¡CAMBIO CLAVE PARA CLOUDINARY!
  // Multer-storage-cloudinary devuelve la URL segura en req.file.path
  const imagen = req.file ? req.file.path : null;
  
  try {
    if (!nombre || !marca_celular || !modelo_celular || !precio_venta || stock === undefined) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    await pool.query(
      `INSERT INTO productos 
      (nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo, material, color, imagen_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo || 5, material || null, color || null, imagen]
    );
    res.status(201).json({ message: 'Producto registrado exitosamente' });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al registrar producto' });
  }
};

const updateStock = async (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;
  try {
    await pool.query('UPDATE productos SET stock = stock - $1 WHERE id = $2', [cantidad, id]);
    res.json({ message: 'Stock actualizado' });
  } catch (error) {
    console.error('ERROR_UPDATE_STOCK:', error);
    res.status(500).json({ message: 'Error al actualizar stock' });
  }
};

const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo, material, color } = req.body;
  
  // ¡CAMBIO CLAVE PARA CLOUDINARY!
  const imagen = req.file ? req.file.path : null;

  try {
    if (!nombre || !marca_celular || !modelo_celular || !precio_venta || stock === undefined) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    let query = `UPDATE productos 
                 SET nombre = $1, marca_celular = $2, modelo_celular = $3, 
                     precio_venta = $4, stock = $5, stock_minimo = $6, 
                     material = $7, color = $8`;
                     
    let params = [nombre, marca_celular, modelo_celular, precio_venta, stock, stock_minimo || 5, material || null, color || null];

    if (imagen) {
      query += ', imagen_url = $9 WHERE id = $10';
      params.push(imagen, id);
    } else {
      query += ' WHERE id = $9';
      params.push(id);
    }

    const result = await pool.query(query, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

const deleteProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE productos SET activo = false WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
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