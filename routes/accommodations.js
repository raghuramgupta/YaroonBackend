const express = require('express');
const router = express.Router();
const upload = require('./multerConfig');
const Accommodation = require('../models/Accommodation');

router.post('/', upload.array('media', 10), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);
    
    // Process uploaded files
    const images = req.files.map(file => ({
      path: file.path, // This should now be defined
      filename: file.filename,
      mimetype: file.mimetype
    }));

    const accommodation = new Accommodation({
      ...data,
      images: images
    });

    await accommodation.save();
    res.status(201).json(accommodation);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Add this new route to get accommodations by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ owner: req.params.userId });
    res.json(accommodations);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch accommodations' });
  }
});

// Get all accommodations with filters
router.get('/', async (req, res) => {
  try {
    const { city, type, minPrice, maxPrice } = req.query;
    const query = {};
    
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (type) query.type = type;
    if (minPrice || maxPrice) {
      query['roomTypes.price'] = {};
      if (minPrice) query['roomTypes.price'].$gte = Number(minPrice);
      if (maxPrice) query['roomTypes.price'].$lte = Number(maxPrice);
    }

    const accommodations = await Accommodation.find(query);
    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch accommodations' });
  }
});

// Get accommodations near a location
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const accommodations = await Accommodation.find({
      'address.coordinates': {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });
    
    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching nearby accommodations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch nearby accommodations' });
  }
});

// Get single accommodation
router.get('/:id', async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id);
      
    if (!accommodation) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }
    
    res.json(accommodation);
  } catch (error) {
    console.error('Error fetching accommodation:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch accommodation' });
  }
});

// Update accommodation
// Update accommodation (FIXED VERSION)
router.put('/:id', upload.array('media', 10), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);
    const { id } = req.params;
    
    // Get existing accommodation
    const existingAccommodation = await Accommodation.findById(id);
    if (!existingAccommodation) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }

    // Process new media files
    const newImages = req.files
      .filter(file => file.mimetype.startsWith('image/'))
      .map(file => ({
        path: file.path,
        filename: file.filename,
        mimetype: file.mimetype
      }));

    const newVideos = req.files
      .filter(file => file.mimetype.startsWith('video/'))
      .map(file => ({
        path: file.path,
        filename: file.filename,
        mimetype: file.mimetype
      }));

    // Handle deleted images
    if (data.deletedImages && data.deletedImages.length > 0) {
      // Delete files from server
      existingAccommodation.images.forEach(img => {
        if (data.deletedImages.includes(img._id.toString())) {
          deleteFile(img.path);
        }
      });
      
      // Remove from array
      existingAccommodation.images = existingAccommodation.images.filter(
        img => !data.deletedImages.includes(img._id.toString())
      );
    }

    // Handle existing images that should be kept
    const keptImages = data.existingImages 
      ? existingAccommodation.images.filter(img => 
          data.existingImages.includes(img._id.toString()))
      : existingAccommodation.images;

    // Prepare update data
    const updateData = {
      ...data,
      images: [...keptImages, ...newImages],
      videos: [...existingAccommodation.videos, ...newVideos],
      updatedAt: Date.now()
    };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.existingImages;
    delete updateData.deletedImages;

    // Perform the update
    const updatedAccommodation = await Accommodation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedAccommodation);
  } catch (error) {
    console.error('Error updating accommodation:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to update accommodation',
      details: error.errors || null
    });
  }
});


// Delete accommodation
router.delete('/:id', async (req, res) => {
  try {
    const accommodation = await Accommodation.findByIdAndDelete(req.params.id);
    
    if (!accommodation) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }
    
    res.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    res.status(500).json({ error: error.message || 'Failed to delete accommodation' });
  }
});

module.exports = router;