const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

exports.getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = { status: 'Completed' };
    const purchaseMatchQuery = {};

    if (startDate && endDate) {
      matchQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      purchaseMatchQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // 1. Total Revenue
    const revenueArray = await Sale.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const revenue = revenueArray.length ? revenueArray[0].total : 0;

    // 2. Total Purchases Cost (total cash out to suppliers)
    const purchaseCostArray = await Purchase.aggregate([
      { $match: purchaseMatchQuery },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const purchaseCost = purchaseCostArray.length ? purchaseCostArray[0].total : 0;

    // 3. Cost of Goods Sold (COGS)
    // Formula: sum of (sold_quantity * product.purchasePrice)
    const cogsArray = await Sale.aggregate([
      { $match: matchQuery },
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
          totalCogs: { $sum: { $multiply: ['$products.quantity', '$prod.purchasePrice'] } }
        }
      }
    ]);
    const cogs = cogsArray.length ? cogsArray[0].totalCogs : 0;

    // 4. Gross Profit (Revenue - COGS)
    const grossProfit = Math.max(0, revenue - cogs);

    // 5. Operating Expenses (simulated rent, electricity, labor, packaging)
    // Rent: 8,000, Salaries: 12,000, Electricity: 2,500, Others: 1,500 (approx. ₹24,000 per month)
    // For smaller ranges we can scale it, but having a simulated expense list matches the reports perfectly
    const expenseList = [
      { name: 'Store Rent', amount: 8000 },
      { name: 'Staff Salaries', amount: 12000 },
      { name: 'Electricity & Utilities', amount: 2500 },
      { name: 'Packaging & Waste', amount: 1500 }
    ];
    const expenses = expenseList.reduce((sum, exp) => sum + exp.amount, 0);

    // 6. Net Profit (Gross Profit - Expenses)
    const netProfit = grossProfit - expenses;

    // 7. Inventory Value
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

    // 8. Monthly breakdown for charts (Jan to Jun, or last 6 months)
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curYear = new Date().getFullYear();

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const mIdx = d.getMonth();
      const start = new Date(d.getFullYear(), mIdx, 1, 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), mIdx + 1, 0, 23, 59, 59, 999);

      // Revenue for month
      const mRev = await Sale.aggregate([
        { $match: { date: { $gte: start, $lte: end }, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]);

      // Purchases for month
      const mPur = await Purchase.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]);

      monthlyData.push({
        month: months[mIdx],
        revenue: mRev.length ? mRev[0].total : 0,
        purchases: mPur.length ? mPur[0].total : 0,
        expenses: 24000 // simulated monthly operating expense
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue,
          purchaseCost,
          cogs,
          grossProfit,
          expenses,
          netProfit,
          inventoryValue
        },
        expensesBreakdown: expenseList,
        charts: monthlyData
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
