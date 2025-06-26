const express = require('express');
const router = express.Router();
const upload = require('./multerConfig');
const Accommodation = require('../models/Accommodation');



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
router.put('/:id', upload.array('media', 10), async (req, res) => {
  try {
    const { body, files } = req;
    
    // Process uploaded files safely
    const mediaUrls = (files || []).map(file => file.path);
    const newImages = mediaUrls.filter(url => url && url.match(/\.(jpg|jpeg|png|gif)$/i));
    const newVideos = mediaUrls.filter(url => url && url.match(/\.(mp4|mov|avi)$/i));

    const accommodation = await Accommodation.findByIdAndUpdate(
      req.params.id,
      { 
        ...body,
        $push: { 
          images: { $each: newImages }, 
          videos: { $each: newVideos } 
        },
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!accommodation) {
      return res.status(404).json({ error: 'Accommodation not found' });
    }
    
    res.json(accommodation);
  } catch (error) {
    console.error('Error updating accommodation:', error);
    res.status(400).json({ error: error.message || 'Failed to update accommodation' });
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