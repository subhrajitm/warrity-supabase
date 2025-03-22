const User = require('../models/user.model');
const Warranty = require('../models/warranty.model');
const Product = require('../models/product.model');
const Event = require('../models/event.model');
const AuditLogService = require('../services/audit-log.service');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log the role change
    await AuditLogService.logAdminAction({
      adminId,
      action: 'role_change',
      resourceType: 'user',
      resourceId: id,
      details: {
        oldRole,
        newRole: role
      },
      req
    });

    res.status(200).json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();

    // Log the user deletion
    await AuditLogService.logAdminAction({
      adminId,
      action: 'delete',
      resourceType: 'user',
      resourceId: id,
      details: {
        email: user.email,
        role: user.role
      },
      req
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get dashboard statistics (admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Get user stats
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = totalUsers - adminUsers;
    
    // Get warranty stats
    const totalWarranties = await Warranty.countDocuments();
    const activeWarranties = await Warranty.countDocuments({ status: 'active' });
    const expiringWarranties = await Warranty.countDocuments({ status: 'expiring' });
    const expiredWarranties = await Warranty.countDocuments({ status: 'expired' });
    
    // Get product stats
    const totalProducts = await Product.countDocuments();
    
    // Get product categories with counts
    const products = await Product.find();
    const categoryData = {};
    
    products.forEach(product => {
      const category = product.category;
      categoryData[category] = (categoryData[category] || 0) + 1;
    });
    
    // Format category data for charts
    const categoryStats = Object.keys(categoryData).map(category => ({
      name: category,
      count: categoryData[category]
    }));
    
    // Get monthly warranty data (for the current year)
    const currentYear = new Date().getFullYear();
    const monthlyData = [];
    
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);
      
      const count = await Warranty.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      monthlyData.push({
        month: new Date(currentYear, month, 1).toLocaleString('default', { month: 'long' }),
        count
      });
    }
    
    res.status(200).json({
      userStats: {
        total: totalUsers,
        admin: adminUsers,
        regular: regularUsers
      },
      warrantyStats: {
        total: totalWarranties,
        active: activeWarranties,
        expiring: expiringWarranties,
        expired: expiredWarranties
      },
      productStats: {
        total: totalProducts,
        categories: categoryStats
      },
      monthlyData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all warranties (admin only)
const getAllWarranties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const warranties = await Warranty.find()
      .populate('user', 'name email')
      .populate('product', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Warranty.countDocuments();

    res.status(200).json({
      warranties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user activity (admin only)
const getUserActivity = async (req, res) => {
  try {
    // Get recent warranties
    const recentWarranties = await Warranty.find()
      .populate('user', 'name email')
      .populate('product')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get recent events
    const recentEvents = await Event.find()
      .populate('user', 'name email')
      .populate('relatedProduct')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json({
      recentWarranties,
      recentEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all products (admin only)
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    res.status(200).json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get warranty analytics (admin only)
const getWarrantyAnalytics = async (req, res) => {
  try {
    const totalWarranties = await Warranty.countDocuments();
    const activeWarranties = await Warranty.countDocuments({ status: 'active' });
    const expiringWarranties = await Warranty.countDocuments({ status: 'expiring' });
    const expiredWarranties = await Warranty.countDocuments({ status: 'expired' });

    // Get warranties by status
    const warrantyByStatus = await Warranty.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get warranties by month
    const currentYear = new Date().getFullYear();
    const warrantyByMonth = [];
    
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);
      
      const count = await Warranty.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      warrantyByMonth.push({
        month: new Date(currentYear, month, 1).toLocaleString('default', { month: 'long' }),
        count
      });
    }

    res.status(200).json({
      totalWarranties,
      activeWarranties,
      expiringWarranties,
      expiredWarranties,
      warrantyByStatus,
      warrantyByMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product analytics (admin only)
const getProductAnalytics = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    
    // Get products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get top products by warranty count
    const topProducts = await Warranty.aggregate([
      {
        $group: {
          _id: '$product',
          warrantyCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$productDetails'
      },
      {
        $project: {
          name: '$productDetails.name',
          warrantyCount: 1,
          _id: 0
        }
      },
      {
        $sort: { warrantyCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      totalProducts,
      productsByCategory,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get admin settings (admin only)
const getSettings = async (req, res) => {
  try {
    // In a real application, you would fetch these settings from a database
    // For now, we'll return default settings
    const settings = {
      notificationSettings: {
        emailNotifications: true,
        pushNotifications: true,
        warrantyExpiryAlerts: true,
        systemAlerts: true
      },
      emailSettings: {
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: process.env.SMTP_PORT || '',
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.FROM_EMAIL || '',
        fromName: process.env.FROM_NAME || ''
      },
      systemSettings: {
        maintenanceMode: false,
        allowRegistration: true,
        maxLoginAttempts: 5,
        sessionTimeout: 30
      }
    };

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update admin settings (admin only)
const updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    // In a real application, you would validate and save these settings to a database
    // For now, we'll just return the updated settings
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product fields
    Object.keys(updateData).forEach(key => {
      if (key in product) {
        product[key] = updateData[key];
      }
    });

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
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product has any associated warranties
    const warrantyCount = await Warranty.countDocuments({ product: productId });
    if (warrantyCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product with associated warranties' 
      });
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete warranty (admin only)
const deleteWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const warranty = await Warranty.findById(id);
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    await warranty.remove();

    // Log the warranty deletion
    await AuditLogService.logAdminAction({
      adminId,
      action: 'delete',
      resourceType: 'warranty',
      resourceId: id,
      details: {
        product: warranty.product,
        status: warranty.status
      },
      req
    });

    res.status(200).json({ message: 'Warranty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update warranty (admin only)
const updateWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.user.id;

    const warranty = await Warranty.findById(id);
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    const oldStatus = warranty.status;
    Object.keys(updateData).forEach(key => {
      if (key in warranty) {
        warranty[key] = updateData[key];
      }
    });

    await warranty.save();

    // Log the warranty update
    await AuditLogService.logAdminAction({
      adminId,
      action: 'update',
      resourceType: 'warranty',
      resourceId: id,
      details: {
        oldStatus,
        newStatus: warranty.status,
        updatedFields: Object.keys(updateData)
      },
      req
    });

    res.status(200).json({
      message: 'Warranty updated successfully',
      warranty
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get admin logs
const getAdminLogs = async (req, res) => {
  try {
    const {
      adminId,
      resourceType,
      action,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const logs = await AuditLogService.getAdminLogs({
      adminId,
      resourceType,
      action,
      startDate,
      endDate,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getAllWarranties,
  getUserActivity,
  getAllProducts,
  getWarrantyAnalytics,
  getProductAnalytics,
  getSettings,
  updateSettings,
  updateProduct,
  deleteProduct,
  deleteWarranty,
  updateWarranty,
  getAdminLogs
}; 