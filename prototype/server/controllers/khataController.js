const Customer = require('../models/Customer');
const KhataTransaction = require('../models/KhataTransaction');
const mongoose = require('mongoose');

// Get all customers with balance and search filter
exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const customers = await Customer.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new customer profile
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address, creditLimit } = req.body;
    
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already exists.' });
    }

    const customer = await Customer.create({
      name,
      phone,
      address,
      creditLimit: creditLimit || 0
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Record payment received from a customer
exports.settlePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, amount, notes } = req.body;

    if (!customerId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Customer ID and valid amount are required.' });
    }

    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Update customer balance
    customer.outstandingBalance -= Number(amount);
    await customer.save({ session });

    // Create Khata transaction
    await KhataTransaction.create([{
      customer: customerId,
      type: 'PAYMENT_RECEIVED',
      amount: Number(amount),
      notes: notes || 'Payment received'
    }], { session });

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Payment recorded successfully.' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
