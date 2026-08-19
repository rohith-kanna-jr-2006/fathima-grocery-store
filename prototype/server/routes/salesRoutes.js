const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const authMiddleware = require('../middleware/auth');

router.get('/', salesController.getSales);
router.get('/:invoice', salesController.getSaleByInvoice);
router.post('/', authMiddleware, salesController.createSale);

module.exports = router;
