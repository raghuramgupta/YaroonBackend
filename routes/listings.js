const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const upload = require('./multerConfig'); // Simple upload middleware
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { ImageAnnotatorClient } = require('@google-cloud/vision').v1;

// Initialize the client
const client = new ImageAnnotatorClient();

// Allowed property-related labels
const allowedLabels = [
  'house', 'room', 'bedroom', 'kitchen', 'bathroom',
  'living room', 'apartment', 'flat', 'home', 'interior', 'architecture'
];

// Helper: Validate image content using Clarifai
async function isPropertyImage(filePath) {
  try {
    const [result] = await client.labelDetection(filePath);
    const labels = result.labelAnnotations.map(label => label.description.toLowerCase());

    // Define what's allowed
    const allowedLabels = [
      'house', 'room', 'apartment', 'flat', 'living room',
      'kitchen', 'bathroom', 'bedroom', 'interior'
    ];

    const isValid = labels.some(label =>
      allowedLabels.some(allowed => label.includes(allowed))
    );

    console.log('🧠 Google Vision result:', labels);
    return isValid;

  } catch (error) {
    console.error('Google Vision error:', error.message);
    return false;
  }
}

/*──────────────────────────  CREATE  ──────────────────────────*/
router.post('/create', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    const body = req.body;

    let parsedAmenities = {};
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = {};
      }
    }

    const updateData = {
      userKey: body.userKey,
      userType: body.userType,
      userinterests: body.userinterests,
      gender: body.gender,
      languages: body.languages,
      foodchoices: body.foodchoices,
      pets: body.pets,
      propertyAddress: body.propertyAddress,
      locality: body.locality,
      propertyStructure: body.propertyStructure,
      roomType: body.roomType,
      washroomType: body.washroomType,
      parkingType: body.parkingType,
      roomSize: body.roomSize,
      apartmentSize: body.apartmentSize,
      rent: body.rent,
      securityDepositOption: body.securityDepositOption,
      amenities: parsedAmenities,
      cookingType: body.cookingType,
      mapLocation: body.mapLocation,
      city: body.city,
      state: body.state,
      country: body.country,
      pinCode: body.pinCode,
      accommodationType: body.accommodationType,
      title: body.title,
      description: body.description
    };

    // Handle date fields safely
    if (body.availableFrom && body.availableFrom !== 'Invalid date' && body.availableFrom !== 'null') {
      updateData.availableFrom = new Date(body.availableFrom);
    } else {
      updateData.availableFrom = undefined;
    }

    if (body.openDate && body.openDate !== 'Invalid date' && body.openDate !== 'null') {
      updateData.openDate = new Date(body.openDate);
    } else {
      updateData.openDate = undefined;
    }

    const tempDir = path.join(__dirname, '..', 'uploads');
    const validImages = [];
    if (req.files?.images) {
  console.log('🔍 Received image files:', req.files.images.map(f => ({
    name: f.originalname,
    bufferPresent: !!f.buffer,
    size: f.size,
    mimetype: f.mimetype
  })));

  for (const file of req.files.images) {
    if (!file || !file.buffer) {
      console.warn('🚫 Invalid file or missing buffer:', file.originalname || 'unknown');
      continue;
    }

    // The rest of your logic...
  }
} else {
  console.warn('⚠️ No images received');
}

    if (req.files?.images) {
      for (const file of req.files.images) {
        if (!file || !file.buffer) {
          console.warn('🚫 Invalid file or missing buffer:', file.originalname || 'unknown');
          continue;
        }
        
        const ext = path.extname(file.originalname).toLowerCase();
        const tempPath = path.join(tempDir, `temp-${Date.now()}-${file.originalname}`);

        try {
          fs.writeFileSync(tempPath, file.buffer);
        } catch (writeErr) {
          console.error(`🚨 Failed to write temp file: ${file.originalname}`, writeErr.message);
          continue;
        }

        const isValid = await isPropertyImage(tempPath);

        if (!isValid) {
          fs.unlinkSync(tempPath); // Remove temp file
          console.warn(`❌ Rejected non-property image: ${file.originalname}`);
          continue;
        }

        const finalFilename = `media-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const finalPath = path.join(tempDir, finalFilename);

        try {
          fs.renameSync(tempPath, finalPath);
          validImages.push(`/uploads/${finalFilename}`);
        } catch (renameErr) {
          console.error(`🚨 Failed to rename file: ${file.originalname}`, renameErr.message);
          fs.unlinkSync(tempPath); // Clean up temp file
        }
      }
    }

    updateData.images = validImages.length > 0 ? validImages : undefined;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    const newListing = new Listing(updateData);
    await newListing.save();

    res.status(201).json({ message: 'Listing created successfully', listing: newListing });

  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ message: 'Server error while creating listing' });
  }
});
/*──────────────────────────  READ ALL  ────────────────────────*/
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find();
    res.json(listings);
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/*──────────────────────────  READ BY USER  ────────────────────*/
router.get('/user/:userKey', async (req, res) => {
  try {
    const decoded = decodeURIComponent(req.params.userKey);
    const listings = await Listing.find({ userKey: decoded });
    res.status(200).json(listings);
  } catch (err) {
    console.error('Error fetching listings for user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/*──────────────────────────  STATS ENDPOINT  ──────────────────*/
router.get('/stats/:userKey', async (req, res) => {
  try {
    const listings = await Listing.find({ userKey: req.params.userKey });

    const stats = listings.map(l => ({
      _id: l._id,
      propertyAddress: l.propertyAddress,
      locality: l.locality,
      propertyStructure: l.propertyStructure,
      viewsLog: l.viewsLog || []
    }));

    res.json(stats);
  } catch (err) {
    console.error('Error building stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/*──────────────────────────  READ ONE & INCREMENT VIEWS  ─────*/
router.get('/:id', async (req, res) => {
  const viewer = req.query.viewer || null;

  const update = {
    $inc: { viewsCount: 1 },
    $push: {
      viewsLog: {
        date: new Date(),
        viewer
      }
    }
  };

  try {
    const updated = await Listing.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Listing not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error fetching/updating listing:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/*──────────────────────────  UPDATE  ──────────────────────────*/
/*──────────────────────────  UPDATE  ──────────────────────────*/
router.put('/:listingId', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    const body = req.body;

    let parsedAmenities = {};
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = {};
      }
    }

    const updateData = {
      userKey: body.userKey,
      userType: body.userType,
      userinterests: body.userinterests,
      gender: body.gender,
      languages: body.languages,
      foodchoices: body.foodchoices,
      pets: body.pets,
      propertyAddress: body.propertyAddress,
      locality: body.locality,
      propertyStructure: body.propertyStructure,
      roomType: body.roomType,
      washroomType: body.washroomType,
      parkingType: body.parkingType,
      roomSize: body.roomSize,
      apartmentSize: body.apartmentSize,
      rent: body.rent,
      securityDepositOption: body.securityDepositOption,
      amenities: parsedAmenities,
      cookingType: body.cookingType,
      mapLocation: body.mapLocation,
      city: body.city,
      state: body.state,
      country: body.country,
      pinCode: body.pinCode,
      accommodationType: body.accommodationType,
      title: body.title,
      description: body.description
    };

    // Sanitize date fields
    if (body.availableFrom && body.availableFrom !== 'Invalid date' && body.availableFrom !== 'null') {
      updateData.availableFrom = new Date(body.availableFrom);
    } else {
      updateData.availableFrom = undefined;
    }

    if (body.openDate && body.openDate !== 'Invalid date' && body.openDate !== 'null') {
      updateData.openDate = new Date(body.openDate);
    } else {
      updateData.openDate = undefined;
    }

    // Get existing media lists from frontend
    let finalImages = [];
    let finalVideos = [];

    if (body.updatedImages) {
      try {
        finalImages = JSON.parse(body.updatedImages);
      } catch (e) {
        console.error('Invalid updatedImages:', e);
      }
    }

    if (body.updatedVideos) {
      try {
        finalVideos = JSON.parse(body.updatedVideos);
      } catch (e) {
        console.error('Invalid updatedVideos:', e);
      }
    }

    // Process new uploads
    const tempDir = path.join(__dirname, '..', 'uploads');

    if (req.files?.images) {
      for (const file of req.files.images) {
        if (!file || !file.buffer) {
          console.warn('🚫 Invalid file or missing buffer:', file.originalname || 'unknown');
          continue;
        }

        const ext = path.extname(file.originalname).toLowerCase();
        const tempPath = path.join(tempDir, `temp-${file.originalname}`);

        try {
          fs.writeFileSync(tempPath, file.buffer);
        } catch (writeErr) {
          console.error(`🚨 Failed to write temp file: ${file.originalname}`, writeErr.message);
          continue;
        }

        const isValid = await isPropertyImage(tempPath);
        if (!isValid) {
          fs.unlinkSync(tempPath);
          console.warn(`❌ Rejected non-property image: ${file.originalname}`);
          continue;
        }

        const finalFilename = `media-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const finalPath = path.join(tempDir, finalFilename);

        fs.renameSync(tempPath, finalPath);
        finalImages.push(`/uploads/${finalFilename}`);
      }
    }

    if (req.files?.videos) {
      req.files.videos.forEach(file => {
        const ext = path.extname(file.originalname).toLowerCase();
        const finalFilename = `video-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const finalPath = path.join(tempDir, finalFilename);

        fs.writeFileSync(finalPath, file.buffer);
        finalVideos.push(`/uploads/${finalFilename}`);
      });
    }

    updateData.images = finalImages.filter(img => typeof img === 'string');
    updateData.videos = finalVideos.filter(vid => typeof vid === 'string');

    // Remove empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    // Optional: Delete old files that were removed
    const currentListing = await Listing.findById(req.params.listingId);

    if (currentListing) {
      const oldImagePaths = currentListing.images || [];
      const deletedImages = oldImagePaths.filter(img => !updateData.images?.includes(img));

      const oldVideoPaths = currentListing.videos || [];
      const deletedVideos = oldVideoPaths.filter(vid => !updateData.videos?.includes(vid));

      [...deletedImages, ...deletedVideos].forEach(filePath => {
        const fullPath = path.join(__dirname, '..', filePath);
        fs.access(fullPath, fs.constants.F_OK, (err) => {
          if (err) {
            console.warn(`File does not exist: ${filePath}`);
            return;
          }

          fs.unlink(fullPath, (deleteErr) => {
            if (deleteErr) {
              console.error(`🚨 Failed to delete file: ${filePath}`, deleteErr);
            } else {
              console.log(`✅ Deleted file: ${filePath}`);
            }
          });
        });
      });
    }

    // Save updated listing
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.listingId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedListing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(updatedListing);

  } catch (err) {
    console.error('Failed to update listing:', err);
    res.status(500).json({ message: 'Failed to update listing', error: err.message });
  }
});
/*──────────────────────────  DELETE  ──────────────────────────*/
router.delete('/:id', async (req, res) => {
  try {
    const result = await Listing.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.status(200).json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('Error deleting listing:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;