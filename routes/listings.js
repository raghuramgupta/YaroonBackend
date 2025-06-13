const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const upload = require('./multerConfig'); // import multer config
const path = require('path');
const fs = require('fs');

/*──────────────────────────  CREATE  ──────────────────────────*/
router.post('/create', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      userKey,
      userType,
      userinterests,
      gender,
      languages,
      foodchoices,
      pets,
      propertyAddress,
      locality,
      propertyStructure,
      roomType,
      washroomType,
      parkingType,
      roomSize,
      apartmentSize,
      rent,
      availableFrom,
      openDate,
      securityDepositOption,
      amenities,
      cookingType,
      mapLocation,
      city,
      state,
      country,
      pinCode,
      accommodationType,
      title,
      description
    } = req.body;

    let parsedAmenities = {};
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = {};
      }
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Valid property image required' });
    }
    // Extract image/video paths
    const images = [];
    const videos = [];

    if (req.files?.images) {
      req.files.images.forEach(file => {
        images.push(`/uploads/${file.filename}`);
      });
    }

    if (req.files?.videos) {
      req.files.videos.forEach(file => {
        videos.push(`/uploads/${file.filename}`);
      });
    }

    const newListing = new Listing({
      userKey,
      userType,
      userinterests,
      gender,
      languages,
      foodchoices,
      pets,
      propertyAddress,
      locality,
      propertyStructure,
      roomType,
      washroomType,
      parkingType,
      roomSize,
      apartmentSize,
      rent,
      availableFrom,
      openDate,
      securityDepositOption,
      amenities: parsedAmenities,
      cookingType,
      mapLocation,
      city,
      state,
      country,
      pinCode,
      accommodationType,
      title,
      description,
      images,
      videos
    });

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
router.put('/:listingId', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    const body = req.body;

    const {
      userKey,
      userType,
      userinterests,
      gender,
      languages,
      foodchoices,
      pets,
      propertyAddress,
      locality,
      propertyStructure,
      roomType,
      washroomType,
      parkingType,
      roomSize,
      apartmentSize,
      rent,
      availableFrom,
      openDate,
      securityDepositOption,
      amenities,
      cookingType,
      mapLocation,
      city,
      state,
      country,
      pinCode,
      accommodationType,
      title,
      description
    } = body;

    let parsedAmenities = {};
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = {};
      }
    }

    const updateData = {
      userKey,
      userType,
      userinterests,
      gender,
      languages,
      foodchoices,
      pets,
      propertyAddress,
      locality,
      propertyStructure,
      roomType,
      washroomType,
      parkingType,
      roomSize,
      apartmentSize,
      rent,
      securityDepositOption,
      amenities: parsedAmenities,
      cookingType,
      mapLocation,
      city,
      state,
      country,
      pinCode,
      accommodationType,
      title,
      description
    };

    // Handle dates
    if (availableFrom && availableFrom !== 'Invalid date' && availableFrom !== 'null') {
      updateData.availableFrom = new Date(availableFrom);
    } else {
      updateData.availableFrom = undefined;
    }

    if (openDate && openDate !== 'Invalid date' && openDate !== 'null') {
      updateData.openDate = new Date(openDate);
    } else {
      updateData.openDate = undefined;
    }

    // Process image/video uploads
    const newImages = [];
    const newVideos = [];

    if (req.files) {
      if (req.files.images) {
        req.files.images.forEach(file => {
          newImages.push(`/uploads/${file.filename}`);
        });
      }

      if (req.files.videos) {
        req.files.videos.forEach(file => {
          newVideos.push(`/uploads/${file.filename}`);
        });
      }
    }

    let finalImages = [];
    let finalVideos = [];

    if (body.updatedImages) {
      try {
        const oldImages = JSON.parse(body.updatedImages);
        finalImages = oldImages.filter(img => typeof img === 'string');
      } catch (e) {
        console.error('Invalid updatedImages:', e);
      }
    }

    if (body.updatedVideos) {
      try {
        const oldVideos = JSON.parse(body.updatedVideos);
        finalVideos = oldVideos.filter(vid => typeof vid === 'string');
      } catch (e) {
        console.error('Invalid updatedVideos:', e);
      }
    }

    updateData.images = [...finalImages, ...newImages];
    updateData.videos = [...finalVideos, ...newVideos];

    // Remove empty arrays
    if (updateData.images.length === 0) delete updateData.images;
    if (updateData.videos.length === 0) delete updateData.videos;

    // Clean up undefined/null fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    // Optional: Delete unused files from disk
    const currentListing = await Listing.findById(req.params.listingId);

    if (currentListing) {
      const oldImagePaths = currentListing.images || [];
      const deletedImages = oldImagePaths.filter(img => !updateData.images?.includes(img));

      const oldVideoPaths = currentListing.videos || [];
      const deletedVideos = oldVideoPaths.filter(vid => !updateData.videos?.includes(vid));

      [...deletedImages, ...deletedVideos].forEach(filePath => {
        const fullPath = path.join(__dirname, '..', filePath);
        fs.unlink(fullPath, err => {
          if (err && err.code !== 'ENOENT') {
            console.error(`Failed to delete file: ${filePath}`, err);
          } else {
            console.log(`✅ Deleted file: ${filePath}`);
          }
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