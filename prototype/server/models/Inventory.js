const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  stockQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  }
}, { timestamps: true });

// Pre-save hook or helper to determine status based on quantity
inventorySchema.pre('save', function(next) {
  if (this.stockQuantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.stockQuantity <= 15) { // Threshold for low stock in grocery
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
