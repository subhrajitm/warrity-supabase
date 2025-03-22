const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'status_change',
      'role_change',
      'settings_update',
      'system_config'
    ]
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['user', 'warranty', 'product', 'settings', 'system']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceType'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog; 