const AuditLog = require('../models/audit-log.model');

class AuditLogService {
  static async logAdminAction({
    adminId,
    action,
    resourceType,
    resourceId,
    details,
    req
  }) {
    try {
      const auditLog = new AuditLog({
        adminId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error to prevent disrupting the main operation
    }
  }

  static async getAdminLogs({
    adminId,
    resourceType,
    action,
    startDate,
    endDate,
    page = 1,
    limit = 20
  }) {
    try {
      const query = {};
      
      if (adminId) query.adminId = adminId;
      if (resourceType) query.resourceType = resourceType;
      if (action) query.action = action;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      
      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .populate('adminId', 'name email')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      throw error;
    }
  }

  static async getResourceHistory(resourceType, resourceId) {
    try {
      return await AuditLog.find({
        resourceType,
        resourceId
      })
      .populate('adminId', 'name email')
      .sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error fetching resource history:', error);
      throw error;
    }
  }
}

module.exports = AuditLogService; 