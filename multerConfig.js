const multer = require('multer');
const path = require('path');

// Store files in memory for validation (e.g., Clarifai)
const storage = multer.memoryStorage();

// Helper function to validate file extension
function isValidFileType(file) {
  const allowedTypes = /\.(jpeg|jpg|png|webp)$/i;
  const ext = path.extname(file.originalname).toLowerCase();
  return allowedTypes.test(ext);
}

// Multer middleware config
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max file size: 5MB
  fileFilter: (req, file, cb) => {
    if (!isValidFileType(file)) {
      return cb(new Error('Only .jpg, .jpeg, .png, and .webp files are allowed'), false);
    }

    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'), false);
    }

    cb(null, true);
  }
});

module.exports = upload;
