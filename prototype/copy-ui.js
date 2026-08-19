const fs = require('fs');
const path = require('path');

const srcBase = 'D:\\project from D\\fathima grocery store\\fathima_grocery_store_web_ui\\stitch_fathima_grocery_inventory_pro';
const destBase = 'D:\\project from D\\fathima grocery store\\prototype';

const mappings = [
  { src: 'login_fathima_grocery_shop', dest: 'client/pages/login/index.html' },
  { src: 'dashboard_fathima_grocery_shop', dest: 'client/pages/dashboard/index.html' },
  { src: 'inventory_fathima_grocery_shop', dest: 'client/pages/inventory/index.html' },
  { src: 'products_management_fathima_grocery_shop', dest: 'client/pages/products/index.html' },
  { src: 'add_new_product_fathima_grocery_shop', dest: 'client/pages/products/add.html' },
  { src: 'sales_management_fathima_grocery_shop', dest: 'client/pages/sales/index.html' },
  { src: 'new_sale_fathima_grocery_shop', dest: 'client/pages/sales/new.html' },
  { src: 'create_new_purchase_fathima_grocery_shop_1', dest: 'client/pages/purchase/new.html' },
  { src: 'purchase_report_fathima_grocery_shop', dest: 'client/pages/purchase/index.html' },
  { src: 'create_new_entry_fathima_grocery_shop', dest: 'client/pages/new-entry/index.html' },
  { src: 'create_new_category_fathima_grocery_shop', dest: 'client/pages/category/index.html' },
  { src: 'add_new_supplier_fathima_grocery_shop', dest: 'client/pages/supplier/index.html' },
  { src: 'stock_adjustment_fathima_grocery_shop_1', dest: 'client/pages/stock-adjustment/index.html' },
  { src: 'profit_loss_fathima_grocery_shop', dest: 'client/pages/profit-loss/index.html' },
  { src: 'reports_analytics_fathima_grocery_shop_1', dest: 'client/pages/reports/index.html' },
  { src: 'sales_report_fathima_grocery_shop', dest: 'client/pages/reports/sales.html' },
  { src: 'purchase_report_fathima_grocery_shop', dest: 'client/pages/reports/purchase.html' },
  { src: 'inventory_report_fathima_grocery_shop', dest: 'client/pages/reports/inventory.html' },
  { src: 'profit_report_fathima_grocery_shop', dest: 'client/pages/reports/profit.html' },
  { src: 'supplier_report_fathima_grocery_shop', dest: 'client/pages/reports/supplier.html' },
  { src: 'stock_report_fathima_grocery_shop', dest: 'client/pages/reports/stock.html' }
];

console.log('Copying UI screens...');
mappings.forEach(mapping => {
  const srcPath = path.join(srcBase, mapping.src, 'code.html');
  const destPath = path.join(destBase, mapping.dest);

  if (fs.existsSync(srcPath)) {
    // Ensure directory exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    // Read and copy file
    let content = fs.readFileSync(srcPath, 'utf8');
    
    // Write out
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`Successfully copied: ${mapping.src} -> ${mapping.dest}`);
  } else {
    console.error(`Source file not found: ${srcPath}`);
  }
});

console.log('UI Copy Completed.');
