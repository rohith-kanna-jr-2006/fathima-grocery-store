const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const StockAdjustment = require('../models/StockAdjustment');
const Category = require('../models/Category');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Products
    const totalProducts = await Product.countDocuments();

    // 2. Inventory Value (stockQuantity * purchasePrice)
    const stockValueArray = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $unwind: '$prod' },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$prod.purchasePrice'] } }
        }
      }
    ]);
    const inventoryValue = stockValueArray.length ? stockValueArray[0].totalValue : 0;

    // Dates for filtering
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 3. Today's Sales
    const todaySalesArray = await Sale.aggregate([
      { $match: { date: { $gte: startOfToday }, status: 'Completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' }
        }
      }
    ]);
    const todaySales = todaySalesArray.length ? todaySalesArray[0].total : 0;

    // 4. Monthly Revenue
    const monthlySalesArray = await Sale.aggregate([
      { $match: { date: { $gte: startOfMonth }, status: 'Completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' }
        }
      }
    ]);
    const monthlyRevenue = monthlySalesArray.length ? monthlySalesArray[0].total : 0;

    // 5. Monthly Profit (Revenue - Cost of goods sold)
    // Formula: sum(qty * (sale_price - purchase_price))
    const profitArray = await Sale.aggregate([
      { $match: { date: { $gte: startOfMonth }, status: 'Completed' } },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $unwind: '$prod' },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: { $multiply: ['$products.quantity', { $subtract: ['$products.price', '$prod.purchasePrice'] }] } }
        }
      }
    ]);
    const monthlyProfit = profitArray.length ? profitArray[0].totalProfit : 0;

    // 6. Low Stock Items count
    const lowStockCount = await Inventory.countDocuments({ status: { $in: ['Low Stock', 'Out of Stock'] } });

    // 7. Recent Sales
    const recentSales = await Sale.find()
      .populate('products.product', 'name')
      .sort({ date: -1 })
      .limit(5);

    // 8. Recent Purchases
    const recentPurchases = await Purchase.find()
      .populate('supplier', 'name')
      .sort({ date: -1 })
      .limit(5);

    // 9. Recent Stock Adjustments
    const recentAdjustments = await StockAdjustment.find()
      .populate('product', 'name')
      .sort({ date: -1 })
      .limit(5);

    // 10. Top Selling Products
    const topSellingArray = await Sale.aggregate([
      { $match: { status: 'Completed' } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          totalQty: { $sum: '$products.quantity' }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $unwind: '$prod' }
    ]);
    const topSelling = topSellingArray.map(item => ({
      name: item.prod.name,
      image: item.prod.image,
      sellingPrice: item.prod.sellingPrice,
      totalQty: item.totalQty
    }));

    // 11. Low Stock Quick List (Urgent Refills)
    const lowStockList = await Inventory.find({ status: { $in: ['Low Stock', 'Out of Stock'] } })
      .populate('product', 'name image unit')
      .limit(5);

    // 12. Weekly Sales Chart Data (last 7 days)
    const weeklySalesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const salesVal = await Sale.aggregate([
        { $match: { date: { $gte: dayStart, $lte: dayEnd }, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]);

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weeklySalesData.push({
        day: weekdays[d.getDay()],
        sales: salesVal.length ? salesVal[0].total : 0
      });
    }

    // 13. Category Distribution Chart Data
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'cat'
        }
      },
      { $unwind: '$cat' },
      {
        $project: {
          categoryName: '$cat.name',
          count: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        cards: {
          totalProducts,
          inventoryValue,
          todaySales,
          monthlyRevenue,
          monthlyProfit,
          lowStockCount
        },
        lists: {
          recentSales,
          recentPurchases,
          recentAdjustments,
          topSelling,
          lowStockList
        },
        charts: {
          weeklySalesData,
          categoryDistribution
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
