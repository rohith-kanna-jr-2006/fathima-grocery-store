const mongoose = require('mongoose');

const khataTransactionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: String,
    enum: ['CREDIT_SALE', 'PAYMENT_RECEIVED'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  notes: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('KhataTransaction', khataTransactionSchema);
