const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');
const upload = require('../middleware/upload.middleware');
const { handleUploadError } = require('../middleware/error.middleware');
// Fix the import - make sure we're importing correctly
const validation = require('../middleware/validation.middleware');

// Get user profile
router.get('/profile', auth, userController.getUserProfile);

// Update user profile
router.put(
  '/profile', 
  auth, 
  validation.userValidationRules.updateProfile, 
  validation.validate, 
  userController.updateProfile
);

// Upload profile picture
router.post('/profile/picture', auth, upload.single('profilePicture'), handleUploadError, userController.uploadProfilePicture);

// Get user by ID (admin only)
router.get('/:id', auth, isAdmin, userController.getUserById);

module.exports = router;