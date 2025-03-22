const Event = require('../models/event.model');

// Get all events for current user
const getAllEvents = async (req, res) => {
  try {
    const { startDate, endDate, eventType } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    
    // Filter by date range if provided
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }
    
    // Filter by event type if provided
    if (eventType && ['warranty', 'maintenance', 'reminder', 'other'].includes(eventType)) {
      query.eventType = eventType;
    }
    
    // Find events
    const events = await Event.find(query)
      .populate('relatedProduct')
      .populate('relatedWarranty')
      .sort({ startDate: 1 });
    
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('relatedProduct')
      .populate('relatedWarranty');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event belongs to current user or user is admin
    if (event.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this event' });
    }
    
    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new event
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      type,
      warranty,
      allDay,
      location,
      color,
      notifications
    } = req.body;
    
    // Transform validated data to match model schema
    const eventData = {
      user: req.user._id,
      title,
      description: description || '',
      eventType: type === 'expiration' ? 'warranty' : type,
      startDate: new Date(date),
      endDate: new Date(date), // For now, using same date for both
      allDay: allDay || false,
      location: location || '',
      color: color || '#3498db',
      relatedWarranty: warranty,
      notifications: notifications || {
        enabled: true,
        reminderTime: 24
      }
    };
    
    // Create event
    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      allDay,
      location,
      color,
      relatedProduct,
      relatedWarranty,
      notifications
    } = req.body;
    
    // Find event
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event belongs to current user or user is admin
    if (event.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }
    
    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (eventType) event.eventType = eventType;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (allDay !== undefined) event.allDay = allDay;
    if (location !== undefined) event.location = location;
    if (color) event.color = color;
    if (relatedProduct !== undefined) event.relatedProduct = relatedProduct;
    if (relatedWarranty !== undefined) event.relatedWarranty = relatedWarranty;
    
    // Update notifications if provided
    if (notifications) {
      if (notifications.enabled !== undefined) event.notifications.enabled = notifications.enabled;
      if (notifications.reminderTime !== undefined) event.notifications.reminderTime = notifications.reminderTime;
    }
    
    await event.save();
    
    res.status(200).json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    // Find event
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event belongs to current user or user is admin
    if (event.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get events by month
const getEventsByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
      return res.status(400).json({ message: 'Invalid year or month' });
    }
    
    // Create date range for the month
    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999); // Last day of month
    
    // Find events in the month
    const events = await Event.find({
      user: req.user._id,
      $or: [
        // Events that start in the month
        { startDate: { $gte: startDate, $lte: endDate } },
        // Events that end in the month
        { endDate: { $gte: startDate, $lte: endDate } },
        // Events that span the month
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ]
    })
      .populate('relatedProduct')
      .populate('relatedWarranty')
      .sort({ startDate: 1 });
    
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByMonth
}; 