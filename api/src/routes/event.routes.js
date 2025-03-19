const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { auth } = require('../middleware/auth.middleware');
// Fix: Import validation properly
const validation = require('../middleware/validation.middleware');

// Get all events for the current user
router.get('/', auth, eventController.getAllEvents);

// Create a new event
// Fix: Use validation.eventValidationRules instead of eventValidationRules
router.post('/', auth, validation.eventValidationRules.create, validation.validate, eventController.createEvent);

// Get event by ID
router.get('/:id', auth, eventController.getEventById);

// Update event
// Fix: Use validation.eventValidationRules instead of eventValidationRules
router.put('/:id', auth, validation.eventValidationRules.update, validation.validate, eventController.updateEvent);

// Delete event
router.delete('/:id', auth, eventController.deleteEvent);

module.exports = router;