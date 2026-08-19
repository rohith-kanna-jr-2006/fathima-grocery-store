const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');

// Get all products with search, category/status filter, and pagination
exports.getProducts = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10, sort } = req.query;

    const query = {};

    // Search by name or barcode
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by Category name or ID
    if (category && category !== 'Category') {
      // Find category first to get ID
      const cat = await Category.findOne({ name: { $regex: category, $options: 'i' } });
      if (cat) {
        query.category = cat._id;
      } else {
        query.category = category; // fallback if ID passed
      }
    }

    // Filter by availability status
    if (status && status !== 'Availability') {
      query.status = status;
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'Name A-Z') {
      sortOptions = { name: 1 };
    } else if (sort === 'Price High-Low') {
      sortOptions = { sellingPrice: -1 };
    } else if (sort === 'Stock Level') {
      // We will handle this or default sorting
    }

    const skipIndex = (page - 1) * limit;
    
    // Query products
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(skipIndex);

    // Get inventories to merge stock quantities
    const productIds = products.map(p => p._id);
    const inventories = await Inventory.find({ product: { $in: productIds } });

    const mergedProducts = products.map(p => {
      const inv = inventories.find(i => i.product.toString() === p._id.toString());
      return {
        ...p.toObject(),
        stockQuantity: inv ? inv.stockQuantity : 0,
        status: inv ? inv.status : p.status
      };
    });

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: mergedProducts,
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

// Get single product details
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const inventory = await Inventory.findOne({ product: product._id });

    return res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        stockQuantity: inventory ? inventory.stockQuantity : 0,
        status: inventory ? inventory.status : product.status
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create product and initialize inventory
exports.createProduct = async (req, res) => {
  try {
    const { name, barcode, category, purchasePrice, sellingPrice, unit, expiryDate, stockQuantity } = req.body;

    // Check duplicate name or barcode
    if (name) {
      const existingName = await Product.findOne({ name });
      if (existingName) {
        return res.status(400).json({ success: false, message: 'Product with this name already exists.' });
      }
    }
    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: 'Product with this barcode already exists.' });
      }
    }

    // Set image path
    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    // Resolve category (create if it's a new string or query existing)
    let categoryId;
    const cat = await Category.findById(category).catch(() => null);
    if (cat) {
      categoryId = cat._id;
    } else {
      // Find by name
      const catByName = await Category.findOne({ name: category });
      if (catByName) {
        categoryId = catByName._id;
      } else {
        // Create new category if not found
        const newCat = await Category.create({ name: category });
        categoryId = newCat._id;
      }
    }

    const newStock = stockQuantity ? Number(stockQuantity) : 0;
    let status = 'In Stock';
    if (newStock <= 0) status = 'Out of Stock';
    else if (newStock <= 15) status = 'Low Stock';

    const product = await Product.create({
      name,
      barcode,
      category: categoryId,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      unit: unit || 'units',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      image,
      status
    });

    // Create corresponding Inventory record
    await Inventory.create({
      product: product._id,
      stockQuantity: newStock,
      status
    });

    return res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      data: product
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { name, barcode, category, purchasePrice, sellingPrice, unit, expiryDate, stockQuantity } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check duplicate name or barcode on other products
    if (name && name !== product.name) {
      const existingName = await Product.findOne({ name, _id: { $ne: productId } });
      if (existingName) {
        return res.status(400).json({ success: false, message: 'Product with this name already exists.' });
      }
      product.name = name;
    }
    if (barcode && barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({ barcode, _id: { $ne: productId } });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: 'Product with this barcode already exists.' });
      }
      product.barcode = barcode;
    }

    if (category) {
      const cat = await Category.findById(category).catch(() => null);
      if (cat) {
        product.category = cat._id;
      } else {
        const catByName = await Category.findOne({ name: category });
        if (catByName) {
          product.category = catByName._id;
        }
      }
    }

    if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (unit !== undefined) product.unit = unit;
    if (expiryDate !== undefined) product.expiryDate = expiryDate ? new Date(expiryDate) : null;

    if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
    }

    // Save product
    await product.save();

    // Update stock quantity and status in Inventory
    if (stockQuantity !== undefined) {
      const inv = await Inventory.findOne({ product: productId });
      if (inv) {
        inv.stockQuantity = Number(stockQuantity);
        await inv.save();
        
        // Sync product status with inventory status
        product.status = inv.status;
        await product.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      data: product
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete corresponding Inventory
    await Inventory.findOneAndDelete({ product: productId });

    return res.status(200).json({
      success: true,
      message: 'Product and inventory record deleted successfully!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
