const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.post('/', ventasController.registrarVenta);
router.get('/historial', ventasController.getHistorialVentas);
router.get('/detalle/:id', ventasController.getDetalleVenta);
router.patch('/:id/estado', ventasController.actualizarEstadoVenta);

module.exports = router;