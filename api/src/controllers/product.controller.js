const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { category, sort } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Build sort options
    let sortOptions = {};
    if (sort === 'nameAsc') {
      sortOptions = { name: 1 }; // Ascending order by name
    } else if (sort === 'nameDesc') {
      sortOptions = { name: -1 }; // Descending order by name
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 }; // Descending order (newest first)
    } else {
      // Default sort by name
      sortOptions = { name: 1 };
    }
    
    // Find products
    const products = await Product.find(query).sort(sortOptions);
    
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new product (admin only)
const createProduct = async (req, res) => {
  try {
    const { name, description, category, manufacturer, model } = req.body;
    
    // Create product
    const product = new Product({
      name,
      description,
      category,
      manufacturer,
      model
    });
    
    await product.save();
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      manufacturer,
      model,
      serialNumber,
      purchaseDate,
      price,
      purchaseLocation,
      receiptNumber,
      notes
    } = req.body;
    
    // Find product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (manufacturer !== undefined) product.manufacturer = manufacturer;
    if (model !== undefined) product.model = model;
    if (serialNumber) product.serialNumber = serialNumber;
    if (purchaseDate !== undefined) product.purchaseDate = purchaseDate;
    if (price !== undefined) product.price = price;
    if (purchaseLocation !== undefined) product.purchaseLocation = purchaseLocation;
    if (receiptNumber !== undefined) product.receiptNumber = receiptNumber;
    if (notes !== undefined) product.notes = notes;
    
    await product.save();
    
    res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
  try {
    // Find product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete product image if exists
    if (product.image) {
      const imagePath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(product.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload product image (admin only)
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Find product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete old image if exists
    if (product.image) {
      const oldImagePath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(product.image));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update product image
    product.image = `/uploads/${req.file.filename}`;
    await product.save();
    
    res.status(200).json({
      message: 'Product image updated successfully',
      image: product.image
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product categories
const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getProductCategories
}; 