const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Listing = require('../models/Listing');

// Add to favorites
router.post('/', async (req, res) => {
  try {
    const { userId, listingId } = req.body;
    
    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ userId, listingId });
    if (existing) {
      return res.status(400).json({ message: 'Already in favorites' });
    }
    console.log("in the loop")
    const favorite = new Favorite({ userId, listingId });
    await favorite.save();
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove from favorites
router.delete('/:userId/:listingId', async (req, res) => {
  try {
    const { userId, listingId } = req.params;
    await Favorite.findOneAndDelete({ userId, listingId });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's favorites
router.get('/:userId', async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.params.userId })
      .populate('listingId')
      .exec();
    
    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;