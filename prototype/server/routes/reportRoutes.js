const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/logs', reportController.getReportLogs);
router.get('/:type', reportController.generateReport);

module.exports = router;
