const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Document schema (for uploaded files)
const DocumentSchema = new Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Warranty schema
const WarrantySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  warrantyProvider: {
    type: String,
    required: true
  },
  warrantyNumber: {
    type: String,
    required: true
  },
  coverageDetails: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'expiring', 'expired'],
    default: 'active'
  },
  documents: [DocumentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
WarrantySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate status based on expiration date
WarrantySchema.pre('save', function(next) {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  if (this.expirationDate < today) {
    this.status = 'expired';
  } else if (this.expirationDate <= thirtyDaysFromNow) {
    this.status = 'expiring';
  } else {
    this.status = 'active';
  }
  
  next();
});

module.exports = mongoose.model('Warranty', WarrantySchema);