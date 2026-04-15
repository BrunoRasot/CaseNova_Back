const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/auditoria.controller');
const verifyToken = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(authorizeRoles('ADMINISTRADOR'));
router.get('/', getLogs);

module.exports = router;
