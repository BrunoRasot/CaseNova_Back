const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboard.controller');

router.get('/summary', getSummary);

module.exports = router;