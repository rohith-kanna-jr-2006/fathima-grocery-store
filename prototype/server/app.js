const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load environment variables
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory.');
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Serve client assets statically
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));
app.use('/images', express.static(path.join(__dirname, '../client/assets/images')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/khata', require('./routes/khataRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/profit-loss', require('./routes/profitRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Front-end Pages Server Routes (Vanilla HTML routing)
app.get(['/', '/login'], (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/login/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/dashboard/index.html'));
});

app.get('/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/inventory/index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/products/index.html'));
});

app.get('/products/add', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/products/add.html'));
});

app.get('/products/edit/:id', (req, res) => {
  // Point to add/edit product page (we'll make the page handle both add and edit dynamically)
  res.sendFile(path.join(__dirname, '../client/pages/products/add.html'));
});

app.get('/sales', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/sales/index.html'));
});

app.get('/sales/new', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/sales/new.html'));
});

app.get('/purchase', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/purchase/index.html'));
});

app.get('/purchase/new', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/purchase/new.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/reports/index.html'));
});

app.get('/reports/sales', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/reports/sales.html'));
});

app.get('/reports/purchase', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/reports/purchase.html'));
});

app.get('/reports/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/reports/inventory.html'));
});

app.get('/reports/profit', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/reports/profit.html'));
});

app.get('/reports/supplier', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/reports/supplier.html'));
});

app.get('/reports/stock', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/reports/stock.html'));
});

app.get('/new-entry', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/new-entry/index.html'));
});

app.get('/category', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/category/index.html'));
});

app.get('/supplier', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/supplier/index.html'));
});

app.get('/stock-adjustment', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/stock-adjustment/index.html'));
});

app.get('/profit-loss', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/profit-loss/index.html'));
});

// Fallback for asset routing if paths mismatch
app.get('*', (req, res) => {
  res.status(404).send('Page not found or static assets mismatch.');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
