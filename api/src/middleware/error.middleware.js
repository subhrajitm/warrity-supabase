/**
 * Error handling middleware for file uploads
 */
const logger = require('../config/logger');

/**
 * Handle errors that occur during file upload
 */
const handleUploadError = (err, req, res, next) => {
  if (err) {
    logger.error(`Upload error: ${err.message}`);
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  }
  next();
};

module.exports = {
  handleUploadError
};