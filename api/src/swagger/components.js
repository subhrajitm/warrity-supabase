/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *         password:
 *           type: string
 *           format: password
 *           description: The password of the user
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: The role of the user
 *         profilePicture:
 *           type: string
 *           description: URL to the user's profile picture
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 *       example:
 *         _id: 60d0fe4f5311236168a109ca
 *         name: John Doe
 *         email: john.doe@example.com
 *         role: user
 *         profilePicture: /uploads/profiles/john-doe.jpg
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *
 *     WarrantyDocument:
 *       type: object
 *       required:
 *         - name
 *         - path
 *         - uploadDate
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the document
 *         path:
 *           type: string
 *           description: The file path of the document
 *         uploadDate:
 *           type: string
 *           format: date-time
 *           description: The date the document was uploaded
 *       example:
 *         name: warranty_receipt.pdf
 *         path: /uploads/documents/warranty_receipt_123456.pdf
 *         uploadDate: 2023-01-01T00:00:00.000Z
 *
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - category
 *         - manufacturer
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: The description of the product
 *         category:
 *           type: string
 *           enum: [Electronics, Appliances, Furniture, Automotive, Clothing, Other]
 *           description: The category of the product
 *         manufacturer:
 *           type: string
 *           description: The manufacturer of the product
 *       example:
 *         _id: 60d0fe4f5311236168a109cc
 *         name: Galaxy S21
 *         description: Samsung flagship smartphone
 *         category: Electronics
 *         manufacturer: Samsung
 *
 *     Warranty:
 *       type: object
 *       required:
 *         - user
 *         - product
 *         - purchaseDate
 *         - expirationDate
 *         - warrantyProvider
 *         - warrantyNumber
 *         - coverageDetails
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the warranty
 *         user:
 *           oneOf:
 *             - type: string
 *               description: The ID of the user who owns the warranty
 *             - $ref: '#/components/schemas/User'
 *         product:
 *           oneOf:
 *             - type: string
 *               description: The ID of the product covered by the warranty
 *             - $ref: '#/components/schemas/Product'
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: The date the product was purchased
 *         expirationDate:
 *           type: string
 *           format: date
 *           description: The date the warranty expires
 *         warrantyProvider:
 *           type: string
 *           description: The company providing the warranty
 *         warrantyNumber:
 *           type: string
 *           description: The warranty identification number
 *         coverageDetails:
 *           type: string
 *           description: Details about what the warranty covers
 *         documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WarrantyDocument'
 *         status:
 *           type: string
 *           enum: [active, expiring, expired]
 *           description: The current status of the warranty
 *         notes:
 *           type: string
 *           description: Additional notes about the warranty
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the warranty was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the warranty was last updated
 *       example:
 *         id: 60d0fe4f5311236168a109cb
 *         user: 60d0fe4f5311236168a109ca
 *         product: 
 *           _id: 60d0fe4f5311236168a109cc
 *           name: Galaxy S21
 *           manufacturer: Samsung
 *         purchaseDate: 2023-01-01
 *         expirationDate: 2024-01-01
 *         warrantyProvider: Samsung
 *         warrantyNumber: WR-12345-6789
 *         coverageDetails: Full coverage for parts and labor
 *         documents: []
 *         status: active
 *         notes: Extended warranty purchased
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *
 *     WarrantyInput:
 *       type: object
 *       required:
 *         - product
 *         - purchaseDate
 *         - expirationDate
 *         - warrantyProvider
 *         - warrantyNumber
 *         - coverageDetails
 *       properties:
 *         product:
 *           type: string
 *           description: The ID of the product
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: The date the product was purchased
 *         expirationDate:
 *           type: string
 *           format: date
 *           description: The date the warranty expires
 *         warrantyProvider:
 *           type: string
 *           description: The company providing the warranty
 *         warrantyNumber:
 *           type: string
 *           description: The warranty identification number
 *         coverageDetails:
 *           type: string
 *           description: Details about what the warranty covers
 *         notes:
 *           type: string
 *           description: Additional notes about the warranty
 *       example:
 *         product: 60d0fe4f5311236168a109cc
 *         purchaseDate: 2023-01-01
 *         expirationDate: 2024-01-01
 *         warrantyProvider: Samsung
 *         warrantyNumber: WR-12345-6789
 *         coverageDetails: Full coverage for parts and labor
 *         notes: Extended warranty purchased
 *
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - eventType
 *         - startDate
 *         - endDate
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the event
 *         title:
 *           type: string
 *           description: The title of the event
 *         description:
 *           type: string
 *           description: The description of the event
 *         eventType:
 *           type: string
 *           enum: [warranty, maintenance, reminder, other]
 *           description: The type of event
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: The start date and time of the event
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: The end date and time of the event
 *         allDay:
 *           type: boolean
 *           description: Whether the event is an all-day event
 *         user:
 *           oneOf:
 *             - type: string
 *               description: The ID of the user associated with the event
 *             - $ref: '#/components/schemas/User'
 *         relatedProduct:
 *           oneOf:
 *             - type: string
 *               description: The ID of the product related to the event
 *             - $ref: '#/components/schemas/Product'
 *         relatedWarranty:
 *           oneOf:
 *             - type: string
 *               description: The ID of the warranty related to the event
 *             - $ref: '#/components/schemas/Warranty'
 *       example:
 *         _id: 60d0fe4f5311236168a109cd
 *         title: Warranty Expiration
 *         description: Samsung Galaxy S21 warranty expires
 *         eventType: warranty
 *         startDate: 2024-01-01T00:00:00.000Z
 *         endDate: 2024-01-01T23:59:59.000Z
 *         allDay: true
 *         user: 60d0fe4f5311236168a109ca
 *         relatedProduct: 60d0fe4f5311236168a109cc
 *         relatedWarranty: 60d0fe4f5311236168a109cb
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *           example:
 *             message: Unauthorized - No token provided
 *     ForbiddenError:
 *       description: User does not have permission to access the resource
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *           example:
 *             message: Forbidden - Insufficient permissions
 *     NotFoundError:
 *       description: The requested resource was not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *           example:
 *             message: Resource not found
 *     ValidationError:
 *       description: Validation error occurred
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     param:
 *                       type: string
 *                     msg:
 *                       type: string
 *           example:
 *             message: Validation failed
 *             errors:
 *               - param: warrantyNumber
 *                 msg: Warranty number is required
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *           example:
 *             message: Internal server error
 */