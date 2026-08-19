const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const StockAdjustment = require('../models/StockAdjustment');
const Report = require('../models/Report');

exports.generateReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, search, category, supplier } = req.query;

    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      matchQuery.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchQuery.date = { $lte: new Date(endDate) };
    }

    let reportData = [];
    let summaryData = {};

    switch (type) {
      case 'sales': {
        const salesQuery = { ...matchQuery };
        if (search) {
          salesQuery.$or = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { customer: { $regex: search, $options: 'i' } }
          ];
        }

        reportData = await Sale.find(salesQuery)
          .populate('products.product', 'name unit')
          .sort({ date: -1 });

        const totalRevenue = reportData.reduce((sum, s) => sum + s.grandTotal, 0);
        const totalItems = reportData.reduce((sum, s) => sum + s.products.reduce((acc, p) => acc + p.quantity, 0), 0);
        const totalDiscount = reportData.reduce((sum, s) => sum + s.discount, 0);
        const totalGst = reportData.reduce((sum, s) => sum + s.gst, 0);

        summaryData = {
          count: reportData.length,
          totalRevenue,
          totalItems,
          totalDiscount,
          totalGst
        };

        await Report.create({
          reportType: 'Sales Report',
          filters: { startDate, endDate, search },
          summaryData
        });
        break;
      }

      case 'purchase': {
        const purchaseQuery = { ...matchQuery };
        if (search) {
          purchaseQuery.invoiceNumber = { $regex: search, $options: 'i' };
        }
        if (supplier && supplier !== 'Supplier') {
          purchaseQuery.supplier = supplier;
        }

        reportData = await Purchase.find(purchaseQuery)
          .populate('supplier', 'name phone')
          .populate('products.product', 'name unit')
          .sort({ date: -1 });

        const totalSpend = reportData.reduce((sum, p) => sum + p.grandTotal, 0);
        const totalItems = reportData.reduce((sum, p) => sum + p.products.reduce((acc, item) => acc + item.quantity, 0), 0);

        summaryData = {
          count: reportData.length,
          totalSpend,
          totalItems
        };

        await Report.create({
          reportType: 'Purchase Report',
          filters: { startDate, endDate, search, supplier },
          summaryData
        });
        break;
      }

      case 'inventory': {
        const invQuery = {};
        const products = await Product.find().populate('category', 'name');
        const inventories = await Inventory.find().populate('product');

        let data = inventories.map(inv => {
          const prod = inv.product;
          return {
            productId: prod ? prod._id : null,
            name: prod ? prod.name : 'Unknown Product',
            barcode: prod ? prod.barcode : '',
            category: prod && prod.category ? prod.category.name : 'Uncategorized',
            purchasePrice: prod ? prod.purchasePrice : 0,
            sellingPrice: prod ? prod.sellingPrice : 0,
            unit: prod ? prod.unit : 'unit',
            stockQuantity: inv.stockQuantity,
            status: inv.status,
            expiryDate: prod ? prod.expiryDate : null,
            totalValue: inv.stockQuantity * (prod ? prod.purchasePrice : 0)
          };
        });

        // Apply filters
        if (search) {
          data = data.filter(d => 
            d.name.toLowerCase().includes(search.toLowerCase()) || 
            d.barcode.includes(search)
          );
        }
        if (category && category !== 'Category') {
          data = data.filter(d => d.category.toLowerCase() === category.toLowerCase());
        }

        reportData = data;

        summaryData = {
          totalProducts: reportData.length,
          totalItems: reportData.reduce((sum, d) => sum + d.stockQuantity, 0),
          totalInventoryValue: reportData.reduce((sum, d) => sum + d.totalValue, 0),
          lowStockCount: reportData.filter(d => d.status === 'Low Stock').length,
          outOfStockCount: reportData.filter(d => d.status === 'Out of Stock').length
        };

        await Report.create({
          reportType: 'Inventory Report',
          filters: { search, category },
          summaryData
        });
        break;
      }

      case 'supplier': {
        // Fetch all suppliers and aggregate purchase order counts and total spent
        const suppliersList = await Supplier.find();
        const purchaseLogs = await Purchase.find().populate('supplier');

        reportData = suppliersList.map(supp => {
          const logs = purchaseLogs.filter(log => log.supplier && log.supplier._id.toString() === supp._id.toString());
          const totalSpent = logs.reduce((sum, log) => sum + log.grandTotal, 0);
          return {
            _id: supp._id,
            name: supp.name,
            phone: supp.phone,
            email: supp.email,
            gstNumber: supp.gstNumber,
            address: supp.address,
            purchasesCount: logs.length,
            totalSpent
          };
        });

        if (search) {
          reportData = reportData.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
        }

        summaryData = {
          totalSuppliers: reportData.length,
          activeSuppliers: reportData.filter(r => r.purchasesCount > 0).length,
          totalSpend: reportData.reduce((sum, r) => sum + r.totalSpent, 0)
        };

        await Report.create({
          reportType: 'Supplier Report',
          filters: { search },
          summaryData
        });
        break;
      }

      case 'profit': {
        // Profit Report is essentially Profit & Loss figures over dates
        const sales = await Sale.find(matchQuery).populate('products.product');
        const purchases = await Purchase.find(matchQuery);

        const revenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
        const purchaseCost = purchases.reduce((sum, p) => sum + p.grandTotal, 0);

        // COGS
        let cogs = 0;
        sales.forEach(sale => {
          sale.products.forEach(item => {
            const prod = item.product;
            if (prod) {
              cogs += item.quantity * prod.purchasePrice;
            }
          });
        });

        const grossProfit = Math.max(0, revenue - cogs);
        const expenses = 24000; // Simulated monthly fixed operating expenses
        const netProfit = grossProfit - expenses;

        reportData = [{
          revenue,
          purchaseCost,
          cogs,
          grossProfit,
          expenses,
          netProfit
        }];

        summaryData = {
          revenue,
          netProfit,
          profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%'
        };

        await Report.create({
          reportType: 'Profit Report',
          filters: { startDate, endDate },
          summaryData
        });
        break;
      }

      case 'stock': {
        // Expiry tracking, stock adjustments, low stock items
        const lowStock = await Inventory.find({ status: { $in: ['Low Stock', 'Out of Stock'] } })
          .populate({
            path: 'product',
            populate: { path: 'category', select: 'name' }
          });

        const allProducts = await Product.find().populate('category', 'name');
        const expiringSoon = allProducts.filter(p => {
          if (!p.expiryDate) return false;
          const diffTime = new Date(p.expiryDate) - new Date();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 0 && diffDays <= 30; // expiring in next 30 days
        });

        const adjustments = await StockAdjustment.find()
          .populate('product', 'name barcode')
          .sort({ createdAt: -1 })
          .limit(20);

        reportData = {
          lowStock: lowStock.map(inv => ({
            name: inv.product ? inv.product.name : 'Unknown',
            barcode: inv.product ? inv.product.barcode : '',
            category: inv.product && inv.product.category ? inv.product.category.name : 'Uncategorized',
            stockQuantity: inv.stockQuantity,
            status: inv.status
          })),
          expiringSoon: expiringSoon.map(p => ({
            name: p.name,
            barcode: p.barcode,
            category: p.category ? p.category.name : 'Uncategorized',
            expiryDate: p.expiryDate,
            status: p.status
          })),
          adjustments: adjustments
        };

        summaryData = {
          lowStockCount: lowStock.length,
          expiringSoonCount: expiringSoon.length,
          adjustmentsCount: adjustments.length
        };

        await Report.create({
          reportType: 'Stock Report',
          filters: {},
          summaryData
        });
        break;
      }

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type.' });
    }

    return res.status(200).json({
      success: true,
      reportType: type,
      summary: summaryData,
      data: reportData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReportLogs = async (req, res) => {
  try {
    const logs = await Report.find().sort({ date: -1 }).limit(20);
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
