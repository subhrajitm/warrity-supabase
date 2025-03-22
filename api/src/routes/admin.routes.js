const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { auth, isAdmin } = require('../middleware/auth.middleware');
const { adminRateLimiter, sensitiveAdminRateLimiter } = require('../middleware/rate-limit.middleware');
const { validateWarrantyUpdate, validateProductUpdate, validateUserRoleUpdate } = require('../middleware/validation.middleware');

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Apply rate limiting to all admin routes
router.use(adminRateLimiter);

// Get all users (admin only)
router.get('/users', auth, isAdmin, adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update user role (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: The new role for the user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Update user role (admin only)
router.put('/users/:id/role', 
  auth, 
  isAdmin, 
  sensitiveAdminRateLimiter,
  validateUserRoleUpdate,
  adminController.updateUserRole
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete your own account
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Delete user (admin only)
router.delete('/users/:id', 
  auth, 
  isAdmin, 
  sensitiveAdminRateLimiter,
  adminController.deleteUser
);

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userStats:
 *                   type: object
 *                 warrantyStats:
 *                   type: object
 *                 productStats:
 *                   type: object
 *                 monthlyData:
 *                   type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get dashboard statistics (admin only)
router.get('/dashboard/stats', auth, isAdmin, adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/warranties:
 *   get:
 *     summary: Get all warranties (admin only)
 *     tags: [Admin, Warranties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all warranties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 warranties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Warranty'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get all warranties (admin only)
router.get('/warranties', auth, isAdmin, adminController.getAllWarranties);

/**
 * @swagger
 * /api/admin/activity:
 *   get:
 *     summary: Get user activity (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent user activity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recentWarranties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Warranty'
 *                 recentEvents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get user activity (admin only)
router.get('/activity', auth, isAdmin, adminController.getUserActivity);

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products (admin only)
 *     tags: [Admin, Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/products', auth, isAdmin, adminController.getAllProducts);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   put:
 *     summary: Update product (admin only)
 *     tags: [Admin, Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/products/:id', 
  auth, 
  isAdmin, 
  sensitiveAdminRateLimiter,
  validateProductUpdate,
  adminController.updateProduct
);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     summary: Delete product (admin only)
 *     tags: [Admin, Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/products/:id', 
  auth, 
  isAdmin, 
  sensitiveAdminRateLimiter,
  adminController.deleteProduct
);

/**
 * @swagger
 * /api/admin/warranties/{id}:
 *   put:
 *     summary: Update warranty (admin only)
 *     tags: [Admin, Warranties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The warranty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WarrantyInput'
 *     responses:
 *       200:
 *         description: Warranty updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/warranties/:id', 
  auth, 
  isAdmin, 
  sensitiveAdminRateLimiter,
  validateWarrantyUpdate,
  adminController.updateWarranty
);

/**
 * @swagger
 * /api/admin/warranties/{id}:
 *   delete:
 *     summary: Delete warranty (admin only)
 *     tags: [Admin, Warranties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The warranty ID
 *     responses:
 *       200:
 *         description: Warranty deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/warranties/:id', 
  auth, 
  isAdmin, 
  sensitiveAdminRateLimiter,
  adminController.deleteWarranty
);

/**
 * @swagger
 * /api/admin/analytics/warranties:
 *   get:
 *     summary: Get warranty analytics (admin only)
 *     tags: [Admin, Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warranty analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalWarranties:
 *                   type: number
 *                 activeWarranties:
 *                   type: number
 *                 expiringWarranties:
 *                   type: number
 *                 expiredWarranties:
 *                   type: number
 *                 warrantyByStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: number
 *                 warrantyByMonth:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/analytics/warranties', auth, isAdmin, adminController.getWarrantyAnalytics);

/**
 * @swagger
 * /api/admin/analytics/products:
 *   get:
 *     summary: Get product analytics (admin only)
 *     tags: [Admin, Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProducts:
 *                   type: number
 *                 productsByCategory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       count:
 *                         type: number
 *                 topProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       warrantyCount:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/analytics/products', auth, isAdmin, adminController.getProductAnalytics);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get admin settings (admin only)
 *     tags: [Admin, Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notificationSettings:
 *                   type: object
 *                 emailSettings:
 *                   type: object
 *                 systemSettings:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/settings', auth, isAdmin, adminController.getSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update admin settings (admin only)
 *     tags: [Admin, Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationSettings:
 *                 type: object
 *               emailSettings:
 *                 type: object
 *               systemSettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/settings', 
  auth, 
  isAdmin, 
  sensitiveAdminRateLimiter,
  adminController.updateSettings
);

// Get admin logs (admin only)
router.get('/logs', auth, isAdmin, adminController.getAdminLogs);

module.exports = router;