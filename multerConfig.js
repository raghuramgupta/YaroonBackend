const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Only store in memory for validation

function isValidFileType(file) {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  return allowedTypes.test(ext);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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