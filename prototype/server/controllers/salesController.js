const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const KhataTransaction = require('../models/KhataTransaction');
const mongoose = require('mongoose');

// Get sales records list with search, filter, pagination
exports.getSales = async (req, res) => {
  try {
    const { search, paymentMethod, page = 1, limit = 15 } = req.query;
    const skipIndex = (page - 1) * limit;

    const query = {};

    if (paymentMethod && paymentMethod !== 'Payment') {
      query.paymentMethod = paymentMethod;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customer: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .populate('products.product', 'name barcode unit')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skipIndex);

    return res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single sale details by ID or Invoice Number
exports.getSaleByInvoice = async (req, res) => {
  try {
    const query = req.params.invoice.startsWith('INV-') 
      ? { invoiceNumber: req.params.invoice } 
      : { _id: req.params.invoice };

    const sale = await Sale.findOne(query).populate('products.product', 'name barcode unit purchasePrice sellingPrice');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    return res.status(200).json({ success: true, data: sale });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new sale transaction
exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customer, invoiceNumber, products, discountPct, gstPct, paymentMethod, cashier, customerId } = req.body;

    if (!products || !products.length) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'At least one product is required to make a sale.' });
    }

    // Generate Invoice Number if not provided
    const invNumber = invoiceNumber || `INV-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    // Verify Invoice Number is unique
    const existingSale = await Sale.findOne({ invoiceNumber: invNumber }).session(session);
    if (existingSale) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Invoice number ${invNumber} already exists. Please regenerate.` });
    }

    let subtotal = 0;
    const saleProducts = [];
    const inventoryUpdates = [];

    // Verify stock and collect prices
    for (const item of products) {
      const { productId, quantity } = item;
      const qty = Number(quantity);

      if (!productId || qty <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Invalid product or quantity in list.' });
      }

      const product = await Product.findById(productId).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
      }

      const inventory = await Inventory.findOne({ product: productId }).session(session);
      if (!inventory || inventory.stockQuantity < qty) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}. Available: ${inventory ? inventory.stockQuantity : 0}, Requested: ${qty}`
        });
      }

      subtotal += product.sellingPrice * qty;
      saleProducts.push({
        product: productId,
        quantity: qty,
        price: product.sellingPrice
      });

      inventoryUpdates.push({
        inventory,
        productId,
        qtyToDeduct: qty
      });
    }

    // Compute Net Totals
    const discPctVal = discountPct ? Number(discountPct) : 0;
    const gstPctVal = gstPct ? Number(gstPct) : 12; // 12% default GST

    const discount = Math.round((subtotal * discPctVal) / 100);
    const gst = Math.round(((subtotal - discount) * gstPctVal) / 100);
    const grandTotal = subtotal - discount + gst;

    // Handle Khata Payment
    if (paymentMethod === 'Khata') {
      if (!customerId) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Customer selection is required for Khata payment.' });
      }

      const customerDoc = await Customer.findById(customerId).session(session);
      if (!customerDoc) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      // Update customer balance
      customerDoc.outstandingBalance += grandTotal;
      await customerDoc.save({ session });

      // Create Khata transaction
      await KhataTransaction.create([{
        customer: customerId,
        type: 'CREDIT_SALE',
        amount: grandTotal,
        notes: `Credit sale - Invoice ${invNumber}`
      }], { session });
    }

    // Create the Sale document
    const sale = await Sale.create([{
      invoiceNumber: invNumber,
      customer: customer || 'Walk-in Customer',
      products: saleProducts,
      subtotal,
      discount,
      gst,
      grandTotal,
      paymentMethod: paymentMethod || 'Cash',
      cashier: cashier || 'Fathima R.',
      status: 'Completed'
    }], { session });

    // Deduct stock from Inventory
    for (const update of inventoryUpdates) {
      update.inventory.stockQuantity -= update.qtyToDeduct;
      await update.inventory.save({ session });

      // Sync Product status
      await Product.findByIdAndUpdate(update.productId, { status: update.inventory.status }, { session });
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: 'Sale transaction completed successfully!',
      data: sale[0]
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
