const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Use diskStorage to save file temporarily for validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

// Clarifai config
const CLARIFAI_API_KEY = '6b563204db704c5cba4d121c24aa0a9c';
const MODEL_ID = 'aaa9d6ee5cf447dd943a32a89512c222f'; // General model ID

// Allowed property-related labels
const allowedLabels = [
  'house', 'room', 'bedroom', 'kitchen', 'bathroom',
  'living room', 'apartment', 'flat', 'home', 'interior', 'architecture'
];

// Helper: Send image to Clarifai and check if it's a valid property image
async function isPropertyImage(filePath) {
  try {
    const clarifaiUrl = `https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`; 

    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);

    form.append('image', fileStream);
    form.append('model_id', MODEL_ID);

    const response = await axios.post(clarifaiUrl, form, {
      headers: {
        'Authorization': `Key ${CLARIFAI_API_KEY}`,
        ...form.getHeaders()
      }
    });

    const concepts = response.data.outputs[0]?.data?.concepts || [];

    const labels = concepts.map(c => c.name.toLowerCase());

    const isValid = labels.some(label =>
      allowedLabels.some(allowed => label.includes(allowed))
    );

    return isValid;

  } catch (error) {
    console.error('Clarifai API error:', error.message);
    return false;
  }
}

// File filter middleware – validates before saving
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedTypes.test(ext)) {
    return cb(new Error('Only .jpg, .jpeg, .png, and .webp files are allowed'), false);
  }

  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only images are allowed'), false);
  }

  // Save temporarily to validate via Clarifai
  const tempPath = path.join(__dirname, '..', 'uploads', `temp_${file.originalname}`);

  fs.writeFile(tempPath, file.buffer, async (err) => {
    if (err) {
      return cb(new Error('Error writing temporary file'), false);
    }

    const isValid = await isPropertyImage(tempPath);

    if (!isValid) {
      fs.unlink(tempPath, (deleteErr) => {
        if (deleteErr) {
          console.error('Failed to delete invalid image:', deleteErr);
        }
      });
      return cb(new Error('Invalid image: Only property/house-related images are allowed.'), false);
    }

    // Move from temp to final location
    const finalFilename = `media-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const finalPath = path.join(__dirname, '..', 'uploads', finalFilename);

    fs.rename(tempPath, finalPath, (renameErr) => {
      if (renameErr) {
        return cb(renameErr, false);
      }

      req.file = req.file || {};
      req.file.path = finalPath;
      req.file.filename = finalFilename;

      cb(null, true);
    });
  });
}

// Final Multer config
const upload = multer({
  storage: multer.memoryStorage(), // Use memory to read buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

module.exports = upload;