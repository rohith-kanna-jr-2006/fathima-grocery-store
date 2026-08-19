const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

// Get purchase logs with supplier and product details populated
exports.getPurchases = async (req, res) => {
  try {
    const { search, paymentStatus, page = 1, limit = 15 } = req.query;
    const skipIndex = (page - 1) * limit;

    const query = {};

    if (paymentStatus && paymentStatus !== 'Payment Status') {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const total = await Purchase.countDocuments(query);
    const purchases = await Purchase.find(query)
      .populate('supplier', 'name email phone')
      .populate('products.product', 'name barcode unit')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skipIndex);

    return res.status(200).json({
      success: true,
      data: purchases,
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

// Create a new purchase
exports.createPurchase = async (req, res) => {
  try {
    const { supplierId, invoiceNumber, products, paymentStatus } = req.body;

    if (!supplierId || !invoiceNumber || !products || !products.length) {
      return res.status(400).json({ success: false, message: 'Supplier, Invoice Number, and at least one Product are required.' });
    }

    let grandTotal = 0;
    const purchaseProducts = [];

    // Process products
    for (const item of products) {
      const { productId, quantity, purchaseCost } = item;

      if (!productId || !quantity || !purchaseCost) {
        return res.status(400).json({ success: false, message: 'Invalid product details in purchase list.' });
      }

      const qty = Number(quantity);
      const cost = Number(purchaseCost);

      if (qty <= 0 || cost <= 0) {
        return res.status(400).json({ success: false, message: 'Quantity and cost must be positive values.' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
      }

      grandTotal += qty * cost;
      purchaseProducts.push({
        product: productId,
        quantity: qty,
        purchaseCost: cost
      });
    }

    const purchase = await Purchase.create({
      invoiceNumber,
      supplier: supplierId,
      products: purchaseProducts,
      grandTotal,
      paymentStatus: paymentStatus || 'Paid'
    });

    // Update inventory stock levels
    for (const item of purchaseProducts) {
      const inv = await Inventory.findOne({ product: item.product });
      if (inv) {
        inv.stockQuantity += item.quantity;
        await inv.save();

        // Sync product status
        await Product.findByIdAndUpdate(item.product, { status: inv.status });
      } else {
        // Fallback: create inventory record if missing
        let status = 'In Stock';
        if (item.quantity <= 15) status = 'Low Stock';
        await Inventory.create({
          product: item.product,
          stockQuantity: item.quantity,
          status
        });
        await Product.findByIdAndUpdate(item.product, { status });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Purchase recorded successfully and stock updated!',
      data: purchase
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
