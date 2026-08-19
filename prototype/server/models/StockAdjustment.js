const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  currentQuantity: {
    type: Number,
    required: true
  },
  adjustmentQuantity: {
    type: Number,
    required: true // Can be positive or negative
  },
  adjustmentType: {
    type: String,
    enum: ['Increase', 'Decrease', 'Damaged', 'Expired', 'Returned', 'Lost'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
