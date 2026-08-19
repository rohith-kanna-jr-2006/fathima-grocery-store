const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['Sales Report', 'Purchase Report', 'Inventory Report', 'Supplier Report', 'Profit Report', 'Stock Report'],
    required: true
  },
  generatedBy: {
    type: String,
    default: 'Fathima R.'
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  summaryData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
