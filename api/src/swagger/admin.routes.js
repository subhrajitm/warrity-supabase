/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative endpoints (admin access only)
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     description: Retrieves a list of all registered users
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
 *             example:
 *               users:
 *                 - _id: "60d0fe4f5311236168a109ca"
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   role: "user"
 *                   profilePicture: "/uploads/profiles/john-doe.jpg"
 *                   createdAt: "2023-01-01T00:00:00.000Z"
 *                   updatedAt: "2023-01-01T00:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update user role (admin only)
 *     description: Updates the role of a specific user
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
 *           example:
 *             role: "admin"
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               message: "User role updated successfully"
 *               user:
 *                 _id: "60d0fe4f5311236168a109ca"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 role: "admin"
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

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     description: Deletes a specific user
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "User deleted successfully"
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

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     description: Retrieves statistics for the admin dashboard
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
 *                   properties:
 *                     total:
 *                       type: number
 *                     admin:
 *                       type: number
 *                     regular:
 *                       type: number
 *                 warrantyStats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     active:
 *                       type: number
 *                     expiring:
 *                       type: number
 *                     expired:
 *                       type: number
 *                 productStats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           count:
 *                             type: number
 *                 monthlyData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: number
 *             example:
 *               userStats:
 *                 total: 10
 *                 admin: 2
 *                 regular: 8
 *               warrantyStats:
 *                 total: 25
 *                 active: 15
 *                 expiring: 5
 *                 expired: 5
 *               productStats:
 *                 total: 20
 *                 categories:
 *                   - name: "Electronics"
 *                     count: 10
 *                   - name: "Appliances"
 *                     count: 5
 *                   - name: "Furniture"
 *                     count: 5
 *               monthlyData:
 *                 - month: "January"
 *                   count: 3
 *                 - month: "February"
 *                   count: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/admin/warranties:
 *   get:
 *     summary: Get all warranties (admin only)
 *     description: Retrieves a list of all warranties across all users
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
 *             example:
 *               warranties:
 *                 - id: "60d0fe4f5311236168a109cb"
 *                   user:
 *                     _id: "60d0fe4f5311236168a109ca"
 *                     name: "John Doe"
 *                     email: "john.doe@example.com"
 *                   product:
 *                     _id: "60d0fe4f5311236168a109cc"
 *                     name: "Galaxy S21"
 *                     manufacturer: "Samsung"
 *                   purchaseDate: "2023-01-01"
 *                   expirationDate: "2024-01-01"
 *                   warrantyProvider: "Samsung"
 *                   warrantyNumber: "WR-12345-6789"
 *                   coverageDetails: "Full coverage for parts and labor"
 *                   status: "active"
 *                   notes: "Extended warranty purchased"
 *                   documents: []
 *                   createdAt: "2023-01-01T00:00:00.000Z"
 *                   updatedAt: "2023-01-01T00:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/admin/activity:
 *   get:
 *     summary: Get user activity (admin only)
 *     description: Retrieves recent user activity across the platform
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
 *             example:
 *               recentWarranties:
 *                 - id: "60d0fe4f5311236168a109cb"
 *                   user:
 *                     _id: "60d0fe4f5311236168a109ca"
 *                     name: "John Doe"
 *                     email: "john.doe@example.com"
 *                   product:
 *                     _id: "60d0fe4f5311236168a109cc"
 *                     name: "Galaxy S21"
 *                     manufacturer: "Samsung"
 *                   purchaseDate: "2023-01-01"
 *                   expirationDate: "2024-01-01"
 *                   status: "active"
 *                   createdAt: "2023-01-01T00:00:00.000Z"
 *               recentEvents:
 *                 - _id: "60d0fe4f5311236168a109cd"
 *                   title: "Warranty Expiration"
 *                   description: "Samsung Galaxy S21 warranty expires"
 *                   eventType: "warranty"
 *                   startDate: "2024-01-01T00:00:00.000Z"
 *                   endDate: "2024-01-01T23:59:59.000Z"
 *                   allDay: true
 *                   user:
 *                     _id: "60d0fe4f5311236168a109ca"
 *                     name: "John Doe"
 *                     email: "john.doe@example.com"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
