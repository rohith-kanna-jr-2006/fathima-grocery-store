const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/auth');

router.get('/', purchaseController.getPurchases);
router.post('/', authMiddleware, purchaseController.createPurchase);

module.exports = router;
