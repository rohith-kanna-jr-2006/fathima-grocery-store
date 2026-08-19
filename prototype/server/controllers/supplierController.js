const Supplier = require('../models/Supplier');

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    return res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    return res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { name, phone, email, gstNumber, address } = req.body;

    if (!name || !phone || !email || !gstNumber || !address) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existingSupplier = await Supplier.findOne({ name });
    if (existingSupplier) {
      return res.status(400).json({ success: false, message: 'Supplier already exists with this name.' });
    }

    const supplier = await Supplier.create({ name, phone, email, gstNumber, address });
    return res.status(201).json({ success: true, message: 'Supplier added successfully!', data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { name, phone, email, gstNumber, address } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (name && name !== supplier.name) {
      const existingSupplier = await Supplier.findOne({ name });
      if (existingSupplier) {
        return res.status(400).json({ success: false, message: 'Supplier name already exists.' });
      }
      supplier.name = name;
    }

    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (gstNumber !== undefined) supplier.gstNumber = gstNumber;
    if (address !== undefined) supplier.address = address;

    await supplier.save();
    return res.status(200).json({ success: true, message: 'Supplier updated successfully!', data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    return res.status(200).json({ success: true, message: 'Supplier deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
