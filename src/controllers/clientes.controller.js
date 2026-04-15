const pool = require('../config/db');

const getClientes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, dni_ruc, nombre, telefono, email, created_at FROM clientes ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('ERROR_GET_CLIENTES:', error);
    res.status(500).json({ message: 'Error al obtener la lista de clientes' });
  }
};

const getClienteByDoc = async (req, res) => {
  const { doc } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT id, dni_ruc, nombre, telefono, email, created_at FROM clientes WHERE dni_ruc = $1',
      [doc]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('ERROR_GET_CLIENTE_DOC:', error);
    res.status(500).json({ message: 'Error al buscar cliente' });
  }
};

const createCliente = async (req, res) => {
  const { dni_ruc, documento, nombre, telefono, email, correo } = req.body;
  const documentoFinal = (documento || dni_ruc || '').trim();
  const correoFinal = (correo || email || '').trim() || null;

  if (!documentoFinal || !nombre) {
    return res.status(400).json({ message: 'DNI/RUC y Nombre son campos obligatorios' });
  }

  try {
    await pool.query(
      'INSERT INTO clientes (dni_ruc, nombre, telefono, email) VALUES ($1, $2, $3, $4)',
      [documentoFinal, nombre, telefono || null, correoFinal]
    );
    res.status(201).json({ message: 'Cliente registrado exitosamente' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El número de documento ya se encuentra registrado' });
    }
    console.error('ERROR_CREATE_CLIENTE:', error);
    res.status(500).json({ message: 'Error interno al registrar el cliente' });
  }
};

const updateCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, email, correo } = req.body;
  const correoFinal = (correo || email || '').trim() || null;

  try {
    const result = await pool.query(
      'UPDATE clientes SET nombre = $1, telefono = $2, email = $3 WHERE id = $4',
      [nombre, telefono || null, correoFinal, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({ message: 'Datos de cliente actualizados' });
  } catch (error) {
    console.error('ERROR_UPDATE_CLIENTE:', error);
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
};

const deleteCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado del sistema' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ message: 'No se puede eliminar el cliente porque tiene ventas asociadas' });
    }
    console.error('ERROR_DELETE_CLIENTE:', error);
    res.status(500).json({ message: 'Error interno al eliminar el cliente' });
  }
};

module.exports = {
  getClientes,
  getClienteByDoc,
  createCliente,
  updateCliente,
  deleteCliente
};