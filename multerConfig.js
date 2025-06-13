const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

console.log('✅ Loading Multer config');

// Use memory storage so we can analyze before saving
const storage = multer.memoryStorage(); // 👈 Changed from disk to memory

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: async (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();

    console.log(`🖼️ File received: ${file.originalname}`);

    if (!allowedTypes.test(ext)) {
      console.warn('❌ Invalid file type:', ext);
      return cb(new Error('Only .jpg, .jpeg, .png, and .webp files are allowed'), false);
    }

    // Save to temp file for validation
    const tempPath = path.join(__dirname, '..', 'uploads', `temp-${Date.now()}-${file.originalname}`);
    
    fs.writeFile(tempPath, file.buffer, async (err) => {
      if (err) {
        console.error('🚨 Failed to write temp file:', err.message);
        return cb(err, false);
      }

      // Validate image via Clarifai
      const isValid = await isPropertyImage(tempPath);

      if (!isValid) {
        fs.unlink(tempPath, (deleteErr) => {
          if (deleteErr) console.error('🚨 Failed to delete invalid image:', deleteErr);
        });

        console.warn('❌ Rejected non-property image:', file.originalname);
        return cb(new Error('Invalid image: Only property/house-related images are allowed.'), false);
      }

      // Move from temp to final location
      const finalFilename = `media-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      const finalPath = path.join(__dirname, '..', 'uploads', finalFilename);

      fs.rename(tempPath, finalPath, (renameErr) => {
        if (renameErr) return cb(renameErr, false);

        req.file = req.file || {};
        req.file.path = finalPath;
        req.file.filename = finalFilename;

        cb(null, true);
      });
    });
  }
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]);

// Allowed labels
const allowedLabels = [
  'house', 'room', 'bedroom', 'kitchen', 'bathroom',
  'living room', 'apartment', 'flat', 'home', 'interior', 'architecture'
];

// Clarifai config
const CLARIFAI_API_KEY = '6b563204db704c5cba4d121c24aa0a9c';
const MODEL_ID = 'aaa9d6ee5cf447dd943a32a89512c222f';

async function isPropertyImage(filePath) {
  try {
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    form.append('image', fileStream);
    form.append('model_id', MODEL_ID);

    const response = await axios.post(
      `https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`, 
      form,
      {
        headers: {
          'Authorization': `Key ${CLARIFAI_API_KEY}`,
          ...form.getHeaders()
        }
      }
    );

    const concepts = response.data.outputs[0]?.data?.concepts || [];
    const labels = concepts.map(c => c.name.toLowerCase());

    const isValid = labels.some(label =>
      allowedLabels.some(allowed => label.includes(allowed))
    );

    console.log('🧠 Clarifai result:', labels);
    console.log('✅ Is valid property image?', isValid);

    return isValid;

  } catch (error) {
    console.error('Clarifai API error:', error.message);
    return false;
  }
}

module.exports = upload;