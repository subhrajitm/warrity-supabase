const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { auth, isAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { handleUploadError } = require('../middleware/error.middleware');
const validation = require('../middleware/validation.middleware');

// Get product categories - specific route should come before parameter routes
router.get('/categories/list', productController.getProductCategories);

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID - parameter route should come after specific routes
router.get('/:id', productController.getProductById);

// Create new product (admin only)
router.post('/', auth, isAdmin, validation.productValidationRules.create, validation.validate, productController.createProduct);

// Update product (admin only)
router.put('/:id', auth, isAdmin, validation.productValidationRules.update, validation.validate, productController.updateProduct);

// Delete product (admin only)
router.delete('/:id', auth, isAdmin, productController.deleteProduct);

// Upload product image (admin only)
router.post('/:id/image', auth, isAdmin, upload.single('image'), handleUploadError, productController.uploadProductImage);

module.exports = router;