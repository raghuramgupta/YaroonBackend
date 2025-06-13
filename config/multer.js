const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

// Clarifai config — replace these with your own values
const CLARIFAI_API_KEY = '6b563204db704c5cba4d121c24aa0a9c';
const CLARIFAI_MODEL_ID = 'general-image-recognition'; // or a custom model ID for property detection

// Helper: Send image to Clarifai and check labels
async function isPropertyImage(filePath) {
  try {
    const formData = new FormData();
    const file = fs.createReadStream(filePath);

    formData.append('image', file);
    formData.append('model_id', CLARIFAI_MODEL_ID);

    const response = await axios.post(
      `https://api.clarifai.com/v2/models/${CLARIFAI_MODEL_ID}/outputs`, 
      formData,
      {
        headers: {
          'Authorization': `Key ${CLARIFAI_API_KEY}`,
          ...formData.getHeaders()
        }
      }
    );

    const concepts = response.data.outputs[0].data.concepts;
    const allowedLabels = [
      'house', 'room', 'apartment', 'flat', 'home',
      'living room', 'kitchen', 'bedroom', 'bathroom',
      'building', 'interior', 'architecture'
    ];

    const matched = concepts.some(concept =>
      allowedLabels.some(label => concept.name.toLowerCase().includes(label))
    );

    return matched;

  } catch (error) {
    console.error('Clarifai API error:', error.message);
    return false;
  }
}

// File filter middleware
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = allowedTypes.test(file.mimetype);

  if (!mimeType) {
    return cb(new Error('Only .jpg, .jpeg, .png, and .webp files are allowed'), false);
  }

  // Save image temporarily for analysis
  const tempPath = path.join(__dirname, '..', 'uploads', `temp_${file.originalname}`);

  fs.writeFile(tempPath, file.buffer, async (err) => {
    if (err) {
      return cb(new Error('Error writing temporary file'), false);
    }

    const isValid = await isPropertyImage(tempPath);

    if (!isValid) {
      fs.unlink(tempPath, (deleteErr) => {
        if (deleteErr) console.error('Failed to delete invalid image:', deleteErr);
      });
      return cb(new Error('Invalid image: Only property/house-related images are allowed.'), false);
    }

    // Move from temp to final location
    const finalFilename = `media-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const finalPath = path.join(__dirname, '..', 'uploads', finalFilename);

    fs.rename(tempPath, finalPath, (renameErr) => {
      if (renameErr) return cb(renameErr, false);
      req.file.filename = finalFilename;
      req.file.path = finalPath;
      cb(null, true);
    });
  });
};

// Use memory storage to access buffer
const upload = multer({
  storage: multer.memoryStorage(), // allows us to read buffer before saving
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;