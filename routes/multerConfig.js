  // routes/multerConfig.js
  const multer = require('multer');
  const path = require('path');

  const storage = multer.memoryStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    }
  });

  const upload = multer({ storage });

  module.exports = upload;