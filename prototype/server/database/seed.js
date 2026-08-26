const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
const User = require('../models/User');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const StockAdjustment = require('../models/StockAdjustment');
const Report = require('../models/Report');

const seedDatabase = async (standalone = false) => {
  try {
    // 1. Connect to Database if standalone
    if (standalone) {
      const connectDB = require('../config/db');
      await connectDB();
    }

    console.log('Clearing database...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Supplier.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    await StockAdjustment.deleteMany({});
    await Report.deleteMany({});
    console.log('Database cleared.');

    // 2. Seed Admin User
    console.log('Seeding user...');
    const hashedPassword = bcrypt.hashSync('password', 10);
    const adminUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'manager'
    });
    console.log('Admin user seeded (admin / password).');

    // 3. Seed Categories (15 Categories)
    console.log('Seeding categories...');
    const categoriesData = [
      { name: 'Fresh Produce', description: 'Vegetables and Fruits', status: 'Active' },
      { name: 'Dairy & Eggs', description: 'Milk, cheese, butter, eggs', status: 'Active' },
      { name: 'Beverages', description: 'Soft drinks, juices, soda, water', status: 'Active' },
      { name: 'Snacks & Sweets', description: 'Chips, crackers, candy, chocolates', status: 'Active' },
      { name: 'Bakery & Bread', description: 'Freshly baked breads, buns, croissants', status: 'Active' },
      { name: 'Pantry Staples', description: 'Flour, sugar, salt, spices, canned soup', status: 'Active' },
      { name: 'Canned Goods', description: 'Canned beans, vegetables, fish', status: 'Active' },
      { name: 'Meat & Seafood', description: 'Chicken, beef, fresh fish, shrimp', status: 'Active' },
      { name: 'Frozen Foods', description: 'Frozen meals, vegetables, ice cream', status: 'Active' },
      { name: 'Personal Care', description: 'Soaps, shampoos, toothpaste', status: 'Active' },
      { name: 'Household Supplies', description: 'Detergents, cleaning sprays, tissues', status: 'Active' },
      { name: 'Baby Care', description: 'Baby food, diapers, baby wipes', status: 'Active' },
      { name: 'Pet Supplies', description: 'Dog and cat food, pet grooming', status: 'Active' },
      { name: 'Pasta & Rice', description: 'Rice varieties, spaghetti, noodles', status: 'Active' },
      { name: 'Oils & Condiments', description: 'Cooking oils, sauces, vinegar', status: 'Active' }
    ];
    const categories = await Category.insertMany(categoriesData);
    console.log(`${categories.length} categories seeded.`);

    // 4. Seed Suppliers (15 Suppliers)
    console.log('Seeding suppliers...');
    const suppliersData = Array.from({ length: 15 }, (_, i) => {
      const idx = i + 1;
      return {
        name: `Supplier Partner ${idx}`,
        phone: `+91 98765 000${String(idx).padStart(2, '0')}`,
        email: `contact@supplier${idx}.com`,
        gstNumber: `32ABCDE${1000 + idx}A1Z${idx}`,
        address: `${idx * 12} Industrial Estate, Lane ${idx}, Cochin, KL 682001`
      };
    });
    const suppliers = await Supplier.insertMany(suppliersData);
    console.log(`${suppliers.length} suppliers seeded.`);

    // 5. Seed Products (50 Products)
    console.log('Seeding products...');
    const productsList = [
      { name: 'Basmati Rice (5kg)', categoryName: 'Pasta & Rice', unit: 'Bag', purchasePrice: 420, sellingPrice: 550, expiryOffset: 365, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80' },
      { name: 'Fortune Sunflower Oil (1L)', categoryName: 'Oils & Condiments', unit: 'Bottle', purchasePrice: 110, sellingPrice: 145, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80' },
      { name: 'Organic Refined Sugar (1kg)', categoryName: 'Pantry Staples', unit: 'Pack', purchasePrice: 38, sellingPrice: 50, expiryOffset: 365, img: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=200&q=80' },
      { name: 'Amul Whole Milk (1L)', categoryName: 'Dairy & Eggs', unit: 'Carton', purchasePrice: 52, sellingPrice: 66, expiryOffset: 7, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80' },
      { name: 'Dettol Liquid Handwash (250ml)', categoryName: 'Personal Care', unit: 'Bottle', purchasePrice: 65, sellingPrice: 85, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=200&q=80' },
      { name: 'Britannia Marie Gold Biscuits', categoryName: 'Snacks & Sweets', unit: 'Pack', purchasePrice: 20, sellingPrice: 28, expiryOffset: 120, img: 'https://images.unsplash.com/photo-1558961303-1d20210a2e4e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Coca-Cola (750ml)', categoryName: 'Beverages', unit: 'Bottle', purchasePrice: 30, sellingPrice: 40, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=80' },
      { name: 'Fresh Potatoes (1kg)', categoryName: 'Fresh Produce', unit: 'kg', purchasePrice: 22, sellingPrice: 32, expiryOffset: 20, img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80' },
      { name: 'Fresh Red Gala Apples (1kg)', categoryName: 'Fresh Produce', unit: 'kg', purchasePrice: 120, sellingPrice: 160, expiryOffset: 15, img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=200&q=80' },
      { name: 'Whole Wheat Bread (400g)', categoryName: 'Bakery & Bread', unit: 'Loaf', purchasePrice: 28, sellingPrice: 38, expiryOffset: 5, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' },
      { name: 'Nestle Maggi Noodles (12-Pack)', categoryName: 'Pasta & Rice', unit: 'Pack', purchasePrice: 110, sellingPrice: 140, expiryOffset: 270, img: 'https://images.unsplash.com/photo-1612966608997-30d411b483c4?auto=format&fit=crop&w=200&q=80' },
      { name: 'Tata Salt (1kg)', categoryName: 'Pantry Staples', unit: 'Pack', purchasePrice: 18, sellingPrice: 24, expiryOffset: 999, img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=200&q=80' },
      { name: 'Cadbury Dairy Milk Silk', categoryName: 'Snacks & Sweets', unit: 'Bar', purchasePrice: 60, sellingPrice: 80, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1549007994-cb92ca817bc7?auto=format&fit=crop&w=200&q=80' },
      { name: 'Fresh Farm Eggs (12 pcs)', categoryName: 'Dairy & Eggs', unit: 'Tray', purchasePrice: 65, sellingPrice: 84, expiryOffset: 14, img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=200&q=80' },
      { name: 'Red Label Tea Powder (500g)', categoryName: 'Beverages', unit: 'Box', purchasePrice: 180, sellingPrice: 220, expiryOffset: 365, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=200&q=80' },
      { name: 'Vim Dishwash Gel (500ml)', categoryName: 'Household Supplies', unit: 'Bottle', purchasePrice: 85, sellingPrice: 115, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=200&q=80' },
      { name: 'Aashirvaad Shudh Chakki Atta (5kg)', categoryName: 'Pasta & Rice', unit: 'Bag', purchasePrice: 210, sellingPrice: 260, expiryOffset: 120, img: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=200&q=80' },
      { name: 'Fresh Tomatoes (1kg)', categoryName: 'Fresh Produce', unit: 'kg', purchasePrice: 30, sellingPrice: 45, expiryOffset: 7, img: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=200&q=80' },
      { name: 'Fresh Onions (1kg)', categoryName: 'Fresh Produce', unit: 'kg', purchasePrice: 25, sellingPrice: 38, expiryOffset: 30, img: 'https://images.unsplash.com/photo-1508747703725-719ae257c84a?auto=format&fit=crop&w=200&q=80' },
      { name: 'Colgate MaxFresh Toothpaste (150g)', categoryName: 'Personal Care', unit: 'Tube', purchasePrice: 75, sellingPrice: 95, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=200&q=80' },
      { name: 'Tropicana Orange Juice (1L)', categoryName: 'Beverages', unit: 'Carton', purchasePrice: 80, sellingPrice: 110, expiryOffset: 120, img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=200&q=80' },
      { name: 'Lays Classic Salted Chips', categoryName: 'Snacks & Sweets', unit: 'Pack', purchasePrice: 15, sellingPrice: 20, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=200&q=80' },
      { name: 'Surf Excel Easy Wash (1kg)', categoryName: 'Household Supplies', unit: 'Pack', purchasePrice: 120, sellingPrice: 150, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=200&q=80' },
      { name: 'Whisper Ultra Clean Sanitary Pads', categoryName: 'Personal Care', unit: 'Pack', purchasePrice: 70, sellingPrice: 90, expiryOffset: 1095, img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80' },
      { name: 'Cerelac Wheat Apple (300g)', categoryName: 'Baby Care', unit: 'Box', purchasePrice: 220, sellingPrice: 275, expiryOffset: 270, img: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=200&q=80' },
      { name: 'Pedigree Adult Dry Dog Food (3kg)', categoryName: 'Pet Supplies', unit: 'Bag', purchasePrice: 510, sellingPrice: 650, expiryOffset: 365, img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=200&q=80' },
      { name: 'Pampers Baby Diapers (M - 20)', categoryName: 'Baby Care', unit: 'Pack', purchasePrice: 280, sellingPrice: 350, expiryOffset: 1095, img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200&q=80' },
      { name: 'Whiskas Dry Cat Food (1.2kg)', categoryName: 'Pet Supplies', unit: 'Bag', purchasePrice: 270, sellingPrice: 340, expiryOffset: 365, img: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=200&q=80' },
      { name: 'Nivea Soft Cream (100ml)', categoryName: 'Personal Care', unit: 'Tub', purchasePrice: 130, sellingPrice: 170, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80' },
      { name: 'Nescafe Classic Coffee (100g)', categoryName: 'Beverages', unit: 'Jar', purchasePrice: 230, sellingPrice: 290, expiryOffset: 540, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80' },
      { name: 'Harvest Gold Sweet Buns', categoryName: 'Bakery & Bread', unit: 'Pack', purchasePrice: 18, sellingPrice: 25, expiryOffset: 4, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' },
      { name: 'McCain Smiles Frozen (750g)', categoryName: 'Frozen Foods', unit: 'Pack', purchasePrice: 110, sellingPrice: 145, expiryOffset: 365, img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=200&q=80' },
      { name: 'Kissan Tomato Ketchup (1kg)', categoryName: 'Oils & Condiments', unit: 'Bottle', purchasePrice: 95, sellingPrice: 130, expiryOffset: 270, img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=200&q=80' },
      { name: 'Haldirams Bhujia Sev (350g)', categoryName: 'Snacks & Sweets', unit: 'Pack', purchasePrice: 75, sellingPrice: 95, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1599490659213-e2b9527b0876?auto=format&fit=crop&w=200&q=80' },
      { name: 'Gillette Guard Razor', categoryName: 'Personal Care', unit: 'unit', purchasePrice: 18, sellingPrice: 25, expiryOffset: 999, img: 'https://images.unsplash.com/photo-1626248801379-51a07f62f4bc?auto=format&fit=crop&w=200&q=80' },
      { name: 'Amul Butter (100g)', categoryName: 'Dairy & Eggs', unit: 'Block', purchasePrice: 42, sellingPrice: 52, expiryOffset: 90, img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Fresh Green Capsicum (500g)', categoryName: 'Fresh Produce', unit: 'Pack', purchasePrice: 20, sellingPrice: 30, expiryOffset: 7, img: 'https://images.unsplash.com/photo-1580256910626-797924302c0b?auto=format&fit=crop&w=200&q=80' },
      { name: 'Kwality Walls Vanilla Ice Cream (700ml)', categoryName: 'Frozen Foods', unit: 'Tub', purchasePrice: 110, sellingPrice: 150, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=200&q=80' },
      { name: 'Harpic Toilet Cleaner (1L)', categoryName: 'Household Supplies', unit: 'Bottle', purchasePrice: 120, sellingPrice: 165, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1585421514738-ee184b24174d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Heineken 0.0 Non-Alcoholic Beer', categoryName: 'Beverages', unit: 'Can', purchasePrice: 65, sellingPrice: 85, expiryOffset: 270, img: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=200&q=80' },
      { name: 'Sunfeast Dark Fantasy Choco Fills', categoryName: 'Snacks & Sweets', unit: 'Pack', purchasePrice: 28, sellingPrice: 40, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1558961303-1d20210a2e4e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Del Monte Canned Sweet Corn (400g)', categoryName: 'Canned Goods', unit: 'Can', purchasePrice: 60, sellingPrice: 80, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1614735241165-6756e1df61ab?auto=format&fit=crop&w=200&q=80' },
      { name: 'Saffola Masala Oats (500g)', categoryName: 'Pantry Staples', unit: 'Pack', purchasePrice: 140, sellingPrice: 180, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80' },
      { name: 'Ariel Complete Detergent (1kg)', categoryName: 'Household Supplies', unit: 'Pack', purchasePrice: 180, sellingPrice: 230, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=200&q=80' },
      { name: 'MamyPoko Pants Standard (S - 46)', categoryName: 'Baby Care', unit: 'Pack', purchasePrice: 320, sellingPrice: 399, expiryOffset: 1095, img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200&q=80' },
      { name: 'Quaker Instant Oats (1kg)', categoryName: 'Pasta & Rice', unit: 'Bag', purchasePrice: 160, sellingPrice: 210, expiryOffset: 365, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80' },
      { name: 'Lizol Floor Cleaner (1L)', categoryName: 'Household Supplies', unit: 'Bottle', purchasePrice: 135, sellingPrice: 185, expiryOffset: 730, img: 'https://images.unsplash.com/photo-1585421514738-ee184b24174d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Cadbury Oreo Chocolate Cookies', categoryName: 'Snacks & Sweets', unit: 'Pack', purchasePrice: 22, sellingPrice: 30, expiryOffset: 180, img: 'https://images.unsplash.com/photo-1558961303-1d20210a2e4e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Nestle KitKat Share Bag (12 pcs)', categoryName: 'Snacks & Sweets', unit: 'Bag', purchasePrice: 110, sellingPrice: 145, expiryOffset: 270, img: 'https://images.unsplash.com/photo-1549007994-cb92ca817bc7?auto=format&fit=crop&w=200&q=80' },
      { name: 'Dano Sterilised Cream (170g)', categoryName: 'Dairy & Eggs', unit: 'Can', purchasePrice: 55, sellingPrice: 75, expiryOffset: 365, img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=200&q=80' }
    ];

    console.log('Inserting products and initializing inventory...');
    const productsToInsert = [];
    const initialStocks = [];

    for (let i = 0; i < productsList.length; i++) {
      const p = productsList[i];
      const categoryObj = categories.find(c => c.name === p.categoryName);
      const categoryId = categoryObj ? categoryObj._id : categories[0]._id;

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + p.expiryOffset);

      const initialStock = Math.floor(Math.random() * 131) + 20;
      initialStocks.push(initialStock);

      let status = 'In Stock';
      if (initialStock <= 0) status = 'Out of Stock';
      else if (initialStock <= 15) status = 'Low Stock';

      const barcodeVal = `890${String(1000000000 + i)}`;

      productsToInsert.push({
        name: p.name,
        barcode: barcodeVal,
        category: categoryId,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        unit: p.unit,
        expiryDate: expiry,
        image: p.img,
        status: status
      });
    }

    const createdProducts = await Product.insertMany(productsToInsert);
    const inventoriesToInsert = createdProducts.map((prod, idx) => {
      const stock = initialStocks[idx];
      let status = 'In Stock';
      if (stock <= 0) status = 'Out of Stock';
      else if (stock <= 15) status = 'Low Stock';
      return {
        product: prod._id,
        stockQuantity: stock,
        status: status
      };
    });
    const createdInventories = await Inventory.insertMany(inventoriesToInsert);
    console.log(`${createdProducts.length} products and inventories created.`);

    // 6. Seed Purchases (120 Purchases)
    console.log('Seeding purchases...');
    const purchaseDocs = [];
    for (let i = 1; i <= 120; i++) {
      const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const numProducts = Math.floor(Math.random() * 3) + 1; // 1 to 3 products
      const selectedProducts = [];
      let grandTotal = 0;

      const addedProductIds = new Set();
      for (let j = 0; j < numProducts; j++) {
        const prod = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        if (addedProductIds.has(prod._id.toString())) continue;
        addedProductIds.add(prod._id.toString());

        const qty = Math.floor(Math.random() * 20) + 10; // 10 to 30 items
        const cost = prod.purchasePrice * qty;
        grandTotal += cost;

        selectedProducts.push({
          product: prod._id,
          quantity: qty,
          purchaseCost: prod.purchasePrice
        });

        // Also increase stock quantity in corresponding inventory
        const inv = createdInventories.find(inv => inv.product.toString() === prod._id.toString());
        if (inv) {
          inv.stockQuantity += qty;
        }
      }

      // Random date in the last 30 days
      const pDate = new Date();
      pDate.setDate(pDate.getDate() - Math.floor(Math.random() * 30));

      const statusOptions = ['Paid', 'Pending', 'Partial'];
      const payStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

      const purchaseObj = {
        invoiceNumber: `PUR-2026-${String(1000 + i)}`,
        supplier: randomSupplier._id,
        products: selectedProducts,
        grandTotal,
        paymentStatus: payStatus,
        date: pDate
      };
      purchaseDocs.push(purchaseObj);
    }
    await Purchase.insertMany(purchaseDocs);
    console.log('120 purchases seeded.');

    // 7. Seed Sales (200 Sales)
    console.log('Seeding sales...');
    const saleDocs = [];
    const customerNames = [
      'John Doe', 'Sarah Connor', 'Michael Scott', 'Dwight Schrute', 
      'Pam Beesly', 'Jim Halpert', 'Bruce Wayne', 'Clark Kent', 
      'Peter Parker', 'Tony Stark', 'Steve Rogers', 'Natasha Romanoff',
      'Walk-in Customer', 'Walk-in Customer', 'Walk-in Customer'
    ];

    for (let i = 1; i <= 200; i++) {
      const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
      const numProducts = Math.floor(Math.random() * 4) + 1; // 1 to 4 products
      const selectedProducts = [];
      let subtotal = 0;

      const addedProductIds = new Set();
      for (let j = 0; j < numProducts; j++) {
        const prod = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        if (addedProductIds.has(prod._id.toString())) continue;
        addedProductIds.add(prod._id.toString());

        const qty = Math.floor(Math.random() * 5) + 1; // 1 to 5 items
        const price = prod.sellingPrice;
        const total = price * qty;
        subtotal += total;

        selectedProducts.push({
          product: prod._id,
          quantity: qty,
          price: price
        });

        // Deduct from inventory
        const inv = createdInventories.find(inv => inv.product.toString() === prod._id.toString());
        if (inv) {
          inv.stockQuantity = Math.max(0, inv.stockQuantity - qty);
        }
      }

      // Discount calculation (0 or 5 or 10 %)
      const discountPct = [0, 0, 5, 10][Math.floor(Math.random() * 4)];
      const discount = Math.round((subtotal * discountPct) / 100);

      // GST calculation (12% of discounted amount)
      const gst = Math.round(((subtotal - discount) * 12) / 100);
      const grandTotal = subtotal - discount + gst;

      // Random date in the last 30 days
      const sDate = new Date();
      sDate.setDate(sDate.getDate() - Math.floor(Math.random() * 30));

      const paymentMethod = ['Cash', 'Card', 'UPI'][Math.floor(Math.random() * 3)];
      const cashier = ['Fathima R.', 'Staff Member'][Math.floor(Math.random() * 2)];

      const saleObj = {
        invoiceNumber: `INV-2026-${String(4000 + i)}`,
        customer: customerName,
        products: selectedProducts,
        subtotal,
        discount,
        gst,
        grandTotal,
        paymentMethod,
        status: 'Completed',
        cashier,
        date: sDate
      };
      saleDocs.push(saleObj);
    }
    await Sale.insertMany(saleDocs);
    console.log('200 sales seeded.');

    // Save final updated stock quantities back to MongoDB
    console.log('Updating inventory stock level state...');
    const inventoryUpdates = createdInventories.map(inv => {
      let status = 'In Stock';
      if (inv.stockQuantity <= 0) status = 'Out of Stock';
      else if (inv.stockQuantity <= 15) status = 'Low Stock';
      return {
        updateOne: {
          filter: { _id: inv._id },
          update: { $set: { stockQuantity: inv.stockQuantity, status } }
        }
      };
    });
    if (inventoryUpdates.length) {
      await Inventory.bulkWrite(inventoryUpdates);
    }
    console.log('Inventory stock levels saved.');

    // 8. Seed Stock Adjustments (10 records)
    console.log('Seeding stock adjustments...');
    const reasons = [
      { type: 'Damaged', text: 'Damaged during unloading' },
      { type: 'Expired', text: 'Exceeded expiration date' },
      { type: 'Lost', text: 'Inventory audit mismatch (lost)' },
      { type: 'Returned', text: 'Customer return (restocked)' },
      { type: 'Increase', text: 'Manual correction from physical count' }
    ];

    const adjustmentsData = [];
    for (let i = 0; i < 10; i++) {
      const prod = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      const adjQty = reason.type === 'Increase' || reason.type === 'Returned' ? 5 : -5;

      const inv = createdInventories.find(inv => inv.product.toString() === prod._id.toString());
      const currentQty = inv ? inv.stockQuantity : 50;

      adjustmentsData.push({
        product: prod._id,
        currentQuantity: currentQty,
        adjustmentQuantity: adjQty,
        adjustmentType: reason.type,
        reason: reason.text,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      });
    }
    await StockAdjustment.insertMany(adjustmentsData);
    console.log('Stock adjustments seeded.');

    // 9. Seed Reports
    console.log('Seeding reports logs...');
    const reportsData = [
      { reportType: 'Sales Report', filters: { period: 'Last 30 Days' }, summaryData: { salesCount: 200, revenue: 180000, discount: 9000, gst: 20520, grandTotal: 191520 } },
      { reportType: 'Purchase Report', filters: { period: 'Last 30 Days' }, summaryData: { purchasesCount: 120, totalSpend: 115000 } },
      { reportType: 'Inventory Report', filters: {}, summaryData: { totalProducts: 50, inStock: 40, lowStock: 8, outOfStock: 2, totalValue: 42910 } },
      { reportType: 'Profit Report', filters: { period: 'Last 30 Days' }, summaryData: { revenue: 180000, cost: 115000, profit: 65000 } }
    ];
    await Report.insertMany(reportsData);
    console.log('Reports history seeded.');

    console.log('Database Seeding Completed Successfully.');
    if (standalone) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('Seeding Failed:', error);
    if (standalone) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = seedDatabase;

