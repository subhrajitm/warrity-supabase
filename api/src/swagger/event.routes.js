/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management for warranty-related reminders and notifications
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of all events for the current user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events by end date (YYYY-MM-DD)
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [warranty, maintenance, reminder, other]
 *         description: Filter events by type
 *     responses:
 *       200:
 *         description: A list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     summary: Create a new event
 *     description: Add a new event to the calendar
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - eventType
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *               description:
 *                 type: string
 *                 description: Event description
 *               eventType:
 *                 type: string
 *                 enum: [warranty, maintenance, reminder, other]
 *                 description: Type of event
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date and time of the event
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date and time of the event
 *               allDay:
 *                 type: boolean
 *                 description: Whether the event is an all-day event
 *               relatedProduct:
 *                 type: string
 *                 description: ID of the related product (if applicable)
 *               relatedWarranty:
 *                 type: string
 *                 description: ID of the related warranty (if applicable)
 *             example:
 *               title: Warranty Expiration
 *               description: Samsung Galaxy S21 warranty expires
 *               eventType: warranty
 *               startDate: 2024-01-01T00:00:00.000Z
 *               endDate: 2024-01-01T23:59:59.000Z
 *               allDay: true
 *               relatedProduct: 60d0fe4f5311236168a109cc
 *               relatedWarranty: 60d0fe4f5311236168a109cb
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieve a specific event by its ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   put:
 *     summary: Update event
 *     description: Update an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *               description:
 *                 type: string
 *                 description: Event description
 *               eventType:
 *                 type: string
 *                 enum: [warranty, maintenance, reminder, other]
 *                 description: Type of event
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date and time of the event
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date and time of the event
 *               allDay:
 *                 type: boolean
 *                 description: Whether the event is an all-day event
 *               relatedProduct:
 *                 type: string
 *                 description: ID of the related product (if applicable)
 *               relatedWarranty:
 *                 type: string
 *                 description: ID of the related warranty (if applicable)
 *             example:
 *               title: Updated Warranty Expiration
 *               description: Updated Samsung Galaxy S21 warranty expires
 *               eventType: warranty
 *               startDate: 2024-01-01T00:00:00.000Z
 *               endDate: 2024-01-01T23:59:59.000Z
 *               allDay: true
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     summary: Delete event
 *     description: Delete an event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/events/upcoming:
 *   get:
 *     summary: Get upcoming events
 *     description: Retrieve a list of upcoming events for the current user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look ahead
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of events to return
 *     responses:
 *       200:
 *         description: A list of upcoming events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/events/warranty/{warrantyId}:
 *   get:
 *     summary: Get events for a specific warranty
 *     description: Retrieve all events associated with a specific warranty
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warrantyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Warranty ID
 *     responses:
 *       200:
 *         description: A list of events for the specified warranty
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
