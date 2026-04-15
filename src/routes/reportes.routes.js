const express = require('express');
const router = express.Router();
const { getReporteGeneral } = require('../controllers/reportes.controller');

router.get('/general', getReporteGeneral);

module.exports = router;
