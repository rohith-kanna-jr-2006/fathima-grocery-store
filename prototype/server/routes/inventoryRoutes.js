const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');

router.get('/', inventoryController.getInventory);
router.get('/adjustments/history', inventoryController.getAdjustmentHistory);
router.post('/adjustments', authMiddleware, inventoryController.adjustStock);

module.exports = router;
