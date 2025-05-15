const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');

// POST /api/listings/create - Create a new listing
router.post('/create', async (req, res) => {
  try {
    const {
      userKey,
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
      securityDeposit,
      amenities,
      cookingType,
      mapLocation
    } = req.body;

    const parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;

    const newListing = new Listing({
      userKey,
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
      securityDeposit,
      amenities: parsedAmenities,
      cookingType,
      mapLocation
    });

    await newListing.save();
    res.status(201).json({ message: 'Listing created successfully', listing: newListing });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ message: 'Server error while creating listing' });
  }
});

// GET /api/listings - Get all listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find();
    res.json(listings);
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/listings/user/:userKey - Get listings by user
router.get('/user/:userKey', async (req, res) => {
  try {
    const decodedEmail = decodeURIComponent(req.params.userKey);
    const listings = await Listing.find({ userKey: decodedEmail });
    res.status(200).json(listings);
  } catch (err) {
    console.error('Error fetching listings for user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/listings/:id - Get a single listing by ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.status(200).json(listing);
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/listings/:listingId - Update a listing
router.put('/:listingId', async (req, res) => {
  try {
    const updated = await Listing.findByIdAndUpdate(
      req.params.listingId,
      { $set: req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Failed to update listing:', err);
    res.status(500).json({ message: 'Failed to update listing', error: err });
  }
});

// DELETE /api/listings/:id - Delete a listing
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
