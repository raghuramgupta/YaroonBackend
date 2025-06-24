const express = require('express');
const router = express.Router();
const WantedListing = require('../models/WantedListing');

/* Create a new wanted listing */
router.post('/create', async (req, res) => {
  try {
    const listing = new WantedListing(req.body);
    await listing.save();
    res.status(201).json(listing);
  } catch (error) {
    console.error('Error creating wanted listing:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/* Get all wanted listings */
router.get('/', async (_req, res) => {
  try {
    const listings = await WantedListing.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
/* Get ONE wanted‑listing by its _id */
router.get('/:id', async (req, res) => {
  try {
    const listing = await WantedListing.findById(req.params.id)
                                       .populate('user', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* Update a wanted listing by ID */
router.put('/:id', async (req, res) => {
  try {
    const updated = await WantedListing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Listing not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

/* Get wanted listings by user ID */
router.get('/user/:id', async (req, res) => {
  try {
    const listings = await WantedListing.find({ user: req.params.id }).sort({
      createdAt: -1,
    });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* Delete a wanted listing by ID */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await WantedListing.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

module.exports = router;
