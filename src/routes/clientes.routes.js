const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/', clientesController.getClientes);
router.get('/:doc', clientesController.getClienteByDoc);
router.post('/', clientesController.createCliente);
router.put('/:id', clientesController.updateCliente);
router.delete('/:id', clientesController.deleteCliente);

module.exports = router;