const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { 
  getProductos, 
  getStockCritico,
  createProducto, 
  updateStock, 
  updateProducto, 
  deleteProducto 
} = require('../controllers/productos.controller');

router.get('/', getProductos);
router.get('/critico', getStockCritico);
router.post('/', upload.single('imagen'), createProducto);
router.put('/stock/:id', updateStock);
router.put('/:id', upload.single('imagen'), updateProducto);
router.delete('/:id', deleteProducto);

module.exports = router;