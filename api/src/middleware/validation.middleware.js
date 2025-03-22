const { body, validationResult } = require('express-validator');

// Validation rules for different entities
const userValidationRules = {
  register: [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  updateProfile: [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('bio').optional(),
    body('socialLinks.twitter').optional().isURL().withMessage('Twitter must be a valid URL'),
    body('socialLinks.linkedin').optional().isURL().withMessage('LinkedIn must be a valid URL'),
    body('socialLinks.github').optional().isURL().withMessage('GitHub must be a valid URL'),
    body('socialLinks.instagram').optional().isURL().withMessage('Instagram must be a valid URL')
  ]
};

// Validation rules for authentication
const authValidationRules = {
  create: [
    body('product').notEmpty().withMessage('Product is required'),
    body('purchaseDate').isDate().withMessage('Valid purchase date is required'),
    body('expirationDate').isDate().withMessage('Valid expiration date is required'),
    body('warrantyProvider').notEmpty().withMessage('Warranty provider is required'),
    body('warrantyNumber').notEmpty().withMessage('Warranty number is required'),
    body('coverageDetails').notEmpty().withMessage('Coverage details are required')
  ],
  update: [
    body('purchaseDate').optional().isDate().withMessage('Valid purchase date is required'),
    body('expirationDate').optional().isDate().withMessage('Valid expiration date is required'),
    body('warrantyProvider').optional().notEmpty().withMessage('Warranty provider is required'),
    body('warrantyNumber').optional().notEmpty().withMessage('Warranty number is required'),
    body('coverageDetails').optional().notEmpty().withMessage('Coverage details are required'),
    body('status').optional().isIn(['active', 'expiring', 'expired']).withMessage('Status must be active, expiring, or expired')
  ]
};

// Validation rules for warranties
const warrantyValidationRules = {
  create: [
    body('product').notEmpty().withMessage('Product is required'),
    body('purchaseDate').isDate().withMessage('Valid purchase date is required'),
    body('expirationDate').isDate().withMessage('Valid expiration date is required'),
    body('warrantyProvider').notEmpty().withMessage('Warranty provider is required'),
    body('warrantyNumber').notEmpty().withMessage('Warranty number is required'),
    body('coverageDetails').notEmpty().withMessage('Coverage details are required')
  ],
  update: [
    body('purchaseDate').optional().isDate().withMessage('Valid purchase date is required'),
    body('expirationDate').optional().isDate().withMessage('Valid expiration date is required'),
    body('warrantyProvider').optional().notEmpty().withMessage('Warranty provider is required'),
    body('warrantyNumber').optional().notEmpty().withMessage('Warranty number is required'),
    body('coverageDetails').optional().notEmpty().withMessage('Coverage details are required'),
    body('status').optional().isIn(['active', 'expiring', 'expired']).withMessage('Status must be active, expiring, or expired')
  ]
};

// Validation rules for products
const productValidationRules = {
  create: [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required')
      .isIn(['Electronics', 'Appliances', 'Furniture', 'Automotive', 'Clothing', 'Other'])
      .withMessage('Invalid category'),
    body('manufacturer').notEmpty().withMessage('Manufacturer is required')
  ],
  update: [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('category').optional()
      .isIn(['Electronics', 'Appliances', 'Furniture', 'Automotive', 'Clothing', 'Other'])
      .withMessage('Invalid category'),
    body('manufacturer').optional().notEmpty().withMessage('Manufacturer cannot be empty')
  ]
};

// Validation rules for events
const eventValidationRules = {
  create: [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('type').isIn(['reminder', 'maintenance', 'expiration']).withMessage('Valid event type is required'),
    body('warranty').optional().isMongoId().withMessage('Valid warranty ID is required')
  ],
  update: [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional(),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('type').optional().isIn(['reminder', 'maintenance', 'expiration']).withMessage('Valid event type is required'),
    body('warranty').optional().isMongoId().withMessage('Valid warranty ID is required')
  ]
};

// Middleware to validate request
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Warranty update validation
const validateWarrantyUpdate = [
  body('product').optional().isMongoId().withMessage('Invalid product ID'),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid purchase date'),
  body('expirationDate').optional().isISO8601().withMessage('Invalid expiration date'),
  body('warrantyProvider').optional().isString().trim().notEmpty(),
  body('warrantyNumber').optional().isString().trim().notEmpty(),
  body('coverageDetails').optional().isString().trim(),
  body('status').optional().isIn(['active', 'expired', 'cancelled']).withMessage('Invalid status'),
  validate
];

// Product update validation
const validateProductUpdate = [
  body('name').optional().isString().trim().notEmpty(),
  body('category').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  validate
];

// User role update validation
const validateUserRoleUpdate = [
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  validate
];

module.exports = {
  userValidationRules,
  authValidationRules,
  warrantyValidationRules,
  productValidationRules,
  eventValidationRules,
  validate,
  validateWarrantyUpdate,
  validateProductUpdate,
  validateUserRoleUpdate
};