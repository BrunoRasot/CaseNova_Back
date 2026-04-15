const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const verifyToken = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(authorizeRoles('ADMINISTRADOR'));

router.get('/', usuariosController.getUsuarios);
router.put('/estado/:id', usuariosController.updateEstadoUsuario);
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;
