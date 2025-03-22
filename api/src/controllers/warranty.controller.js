const Warranty = require('../models/warranty.model');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Get all warranties for the current user
 */
exports.getAllWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find({ user: req.user.id })
      .populate('product', 'name brand category')
      .sort({ createdAt: -1 });
    
    res.json(warranties);
  } catch (error) {
    logger.error(`Error getting warranties: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get warranties expiring soon (within 30 days)
 */
// Make sure this function is properly defined as a function, not an object
exports.getExpiringWarranties = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    // Your implementation to get expiring warranties
    // Example:
    const warranties = await Warranty.find({
      user: req.user.id,
      expirationDate: {
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    }).populate('product');
    
    res.json(warranties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get warranty statistics
 */
exports.getWarrantyStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const total = await Warranty.countDocuments({ user: req.user.id });
    
    const active = await Warranty.countDocuments({
      user: req.user.id,
      expirationDate: { $gt: thirtyDaysFromNow }
    });
    
    const expiring = await Warranty.countDocuments({
      user: req.user.id,
      expirationDate: {
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    });
    
    const expired = await Warranty.countDocuments({
      user: req.user.id,
      expirationDate: { $lt: today }
    });
    
    res.json({
      total,
      active,
      expiring,
      expired
    });
  } catch (error) {
    logger.error(`Error getting warranty stats: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get warranty by ID
 */
exports.getWarrantyById = async (req, res) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('product', 'name brand category');
    
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }
    
    res.json(warranty);
  } catch (error) {
    logger.error(`Error getting warranty by ID: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Create a new warranty
 */
exports.createWarranty = async (req, res) => {
  try {
    const {
      product,
      purchaseDate,
      expirationDate,
      warrantyProvider,
      warrantyNumber,
      coverageDetails,
      notes,
      documents = []
    } = req.body;
    
    const warranty = new Warranty({
      user: req.user.id,
      product,
      purchaseDate,
      expirationDate,
      warrantyProvider,
      warrantyNumber,
      coverageDetails,
      notes,
      documents: documents.map(doc => ({
        filename: doc.path.split('/').pop(),
        originalName: doc.name,
        path: doc.path,
        mimetype: doc.path.split('.').pop() || 'application/octet-stream',
        size: 0, // Size is unknown from frontend
        uploadedAt: doc.uploadDate || new Date().toISOString()
      }))
    });
    
    await warranty.save();
    
    // Populate the product information before sending the response
    await warranty.populate('product', 'name brand category');
    
    res.status(201).json(warranty);
  } catch (error) {
    logger.error(`Error creating warranty: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update a warranty
 */
exports.updateWarranty = async (req, res) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }
    
    const {
      product,
      purchaseDate,
      expirationDate,
      warrantyProvider,
      warrantyNumber,
      coverageDetails,
      notes
    } = req.body;
    
    // Update fields if provided
    if (product) warranty.product = product;
    if (purchaseDate) warranty.purchaseDate = new Date(purchaseDate);
    if (expirationDate) warranty.expirationDate = new Date(expirationDate);
    if (warrantyProvider) warranty.warrantyProvider = warrantyProvider;
    if (warrantyNumber) warranty.warrantyNumber = warrantyNumber;
    if (coverageDetails) warranty.coverageDetails = coverageDetails;
    if (notes !== undefined) warranty.notes = notes;
    
    // Validate the updated warranty
    const validationError = warranty.validateSync();
    if (validationError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(validationError.errors).map(err => err.message)
      });
    }
    
    await warranty.save();
    
    // Populate the product information before sending the response
    await warranty.populate('product', 'name brand category');
    
    res.json(warranty);
  } catch (error) {
    logger.error(`Error updating warranty: ${error.message}`);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete a warranty
 */
exports.deleteWarranty = async (req, res) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }
    
    await warranty.remove();
    
    res.json({ message: 'Warranty deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting warranty: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Upload a document for a warranty
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!warranty) {
      // Delete the uploaded file if warranty not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Warranty not found' });
    }
    
    // Add document to warranty
    warranty.documents.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    await warranty.save();
    
    res.json(warranty);
  } catch (error) {
    logger.error(`Error uploading document: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete a document from a warranty
 */
exports.deleteDocument = async (req, res) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }
    
    // Find the document in the warranty
    const document = warranty.documents.id(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Delete the file from the filesystem
    try {
      fs.unlinkSync(document.path);
    } catch (err) {
      logger.warn(`Could not delete file: ${err.message}`);
    }
    
    // Remove the document from the warranty
    document.remove();
    await warranty.save();
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting document: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};