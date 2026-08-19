const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const StockAdjustment = require('../models/StockAdjustment');

// Get current inventory status with search and status filters
exports.getInventory = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 15 } = req.query;

    const skipIndex = (page - 1) * limit;

    // We need to filter inventory by product criteria (search name/barcode and category)
    const productQuery = {};
    if (search) {
      productQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    // Direct find products matching search
    const matchingProducts = await Product.find(productQuery).select('_id');
    const matchingProductIds = matchingProducts.map(p => p._id);

    // Build main inventory query
    const inventoryQuery = {
      product: { $in: matchingProductIds }
    };

    if (status && status !== 'Status') {
      inventoryQuery.status = status;
    }

    const total = await Inventory.countDocuments(inventoryQuery);
    
    const inventory = await Inventory.find(inventoryQuery)
      .populate({
        path: 'product',
        populate: { path: 'category', select: 'name' }
      })
      .limit(Number(limit))
      .skip(skipIndex);

    // Filter by Category name on populated fields if Category was selected
    let filteredInventory = inventory;
    if (category && category !== 'Category') {
      filteredInventory = inventory.filter(item => 
        item.product && item.product.category && 
        item.product.category.name.toLowerCase() === category.toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      data: filteredInventory,
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

// Create a stock adjustment
exports.adjustStock = async (req, res) => {
  try {
    const { productId, adjustmentQuantity, adjustmentType, reason } = req.body;

    if (!productId || adjustmentQuantity === undefined || !adjustmentType || !reason) {
      return res.status(400).json({ success: false, message: 'All fields (productId, adjustmentQuantity, adjustmentType, reason) are required.' });
    }

    const qty = Number(adjustmentQuantity);
    if (qty === 0) {
      return res.status(400).json({ success: false, message: 'Adjustment quantity cannot be zero.' });
    }

    const inventory = await Inventory.findOne({ product: productId }).populate('product');
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory record not found for this product.' });
    }

    const currentQty = inventory.stockQuantity;
    // Calculate new quantity
    let newQty = currentQty + qty;

    // For decreases, quantity should be negative in database or handled properly
    // The user input might enter 5 and select "Decrease". Let's handle signs appropriately based on type:
    // If user selected Decrease/Damaged/Expired/Lost, ensure the change is negative
    let finalChange = qty;
    if (['Decrease', 'Damaged', 'Expired', 'Lost'].includes(adjustmentType)) {
      finalChange = -Math.abs(qty);
    } else if (['Increase', 'Returned'].includes(adjustmentType)) {
      finalChange = Math.abs(qty);
    }
    
    newQty = currentQty + finalChange;
    if (newQty < 0) {
      return res.status(400).json({ success: false, message: `Invalid adjustment. Stock cannot fall below 0. Current stock: ${currentQty}` });
    }

    // Save adjustment log
    const adjustment = await StockAdjustment.create({
      product: productId,
      currentQuantity: currentQty,
      adjustmentQuantity: finalChange,
      adjustmentType,
      reason
    });

    // Update inventory quantity and trigger pre-save hook for status update
    inventory.stockQuantity = newQty;
    await inventory.save();

    // Sync product status
    await Product.findByIdAndUpdate(productId, { status: inventory.status });

    return res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully!',
      data: {
        adjustment,
        newStock: inventory.stockQuantity,
        status: inventory.status
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get adjustment history
exports.getAdjustmentHistory = async (req, res) => {
  try {
    const history = await StockAdjustment.find()
      .populate('product', 'name barcode unit')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
