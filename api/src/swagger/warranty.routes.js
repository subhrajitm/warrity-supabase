/**
 * @swagger
 * tags:
 *   name: Warranties
 *   description: Warranty management endpoints
 */

/**
 * @swagger
 * /api/warranties:
 *   get:
 *     summary: Get all warranties for the authenticated user
 *     description: Retrieves all warranties belonging to the currently authenticated user
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of warranties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Warranty'
 *             example:
 *               - id: "60d0fe4f5311236168a109cb"
 *                 user: "60d0fe4f5311236168a109ca"
 *                 product:
 *                   _id: "60d0fe4f5311236168a109cc"
 *                   name: "Galaxy S21"
 *                   manufacturer: "Samsung"
 *                 purchaseDate: "2023-01-01"
 *                 expirationDate: "2024-01-01"
 *                 warrantyProvider: "Samsung"
 *                 warrantyNumber: "WR-12345-6789"
 *                 coverageDetails: "Full coverage for parts and labor"
 *                 status: "active"
 *                 notes: "Extended warranty purchased"
 *                 documents: []
 *                 createdAt: "2023-01-01T00:00:00.000Z"
 *                 updatedAt: "2023-01-01T00:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: Create a new warranty
 *     description: Creates a new warranty for the authenticated user
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WarrantyInput'
 *           example:
 *             product: "60d0fe4f5311236168a109cc"
 *             purchaseDate: "2023-01-01"
 *             expirationDate: "2024-01-01"
 *             warrantyProvider: "Samsung"
 *             warrantyNumber: "WR-12345-6789"
 *             coverageDetails: "Full coverage for parts and labor"
 *             notes: "Extended warranty purchased"
 *     responses:
 *       201:
 *         description: Warranty created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warranty'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/warranties/expiring:
 *   get:
 *     summary: Get warranties expiring soon
 *     description: Retrieves warranties that are expiring within the next 30 days
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of warranties expiring soon
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Warranty'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/warranties/stats/overview:
 *   get:
 *     summary: Get warranty statistics overview
 *     description: Retrieves statistics about the user's warranties
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warranty statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalWarranties:
 *                   type: number
 *                   description: Total number of warranties
 *                 activeWarranties:
 *                   type: number
 *                   description: Number of active warranties
 *                 expiringWarranties:
 *                   type: number
 *                   description: Number of warranties expiring soon
 *                 expiredWarranties:
 *                   type: number
 *                   description: Number of expired warranties
 *             example:
 *               totalWarranties: 10
 *               activeWarranties: 5
 *               expiringWarranties: 2
 *               expiredWarranties: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/warranties/{id}:
 *   get:
 *     summary: Get warranty by ID
 *     description: Retrieves a specific warranty by its ID
 *     tags: [Warranties]
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
 *         description: Warranty details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warranty'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: Update a warranty
 *     description: Updates an existing warranty
 *     tags: [Warranties]
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
 *             type: object
 *             properties:
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 description: The date the product was purchased
 *               expirationDate:
 *                 type: string
 *                 format: date
 *                 description: The date the warranty expires
 *               warrantyProvider:
 *                 type: string
 *                 description: The company providing the warranty
 *               warrantyNumber:
 *                 type: string
 *                 description: The warranty identification number
 *               coverageDetails:
 *                 type: string
 *                 description: Details about what the warranty covers
 *               notes:
 *                 type: string
 *                 description: Additional notes about the warranty
 *               status:
 *                 type: string
 *                 enum: [active, expiring, expired]
 *                 description: The current status of the warranty
 *           example:
 *             expirationDate: "2025-01-01"
 *             notes: "Extended warranty purchased for an additional year"
 *     responses:
 *       200:
 *         description: Warranty updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warranty'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: Delete a warranty
 *     description: Deletes a warranty by its ID
 *     tags: [Warranties]
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/warranties/{id}/documents:
 *   post:
 *     summary: Upload documents for a warranty
 *     description: Uploads one or more documents for a specific warranty
 *     tags: [Warranties]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The documents to upload (max 5 files)
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       400:
 *         description: No files uploaded or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/warranties/{id}/documents/{documentId}:
 *   delete:
 *     summary: Delete a document from a warranty
 *     description: Deletes a specific document from a warranty
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The warranty ID
 *       - in: path
 *         name: documentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
