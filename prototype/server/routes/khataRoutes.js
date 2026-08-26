const express = require('express');
const router = express.Router();
const khataController = require('../controllers/khataController');
const authMiddleware = require('../middleware/auth');

router.get('/customers', khataController.getCustomers);
router.post('/customers', authMiddleware, khataController.createCustomer);
router.post('/settle', authMiddleware, khataController.settlePayment);

module.exports = router;
