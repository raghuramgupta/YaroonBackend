// routes/listings.js
const express  = require('express');
const router   = express.Router();
const Listing  = require('../models/Listing');

/*──────────────────────────  CREATE  ──────────────────────────*/
router.post('/create', async (req, res) => {
  try {
    const {
      userKey,userType,userinterests,gender,languages,foodchoices,
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
      accommodationType,   // <-- added
      title                // <-- added
    } = req.body;

    const parsedAmenities =
      typeof amenities === 'string' ? JSON.parse(amenities) : amenities;

    const newListing = new Listing({
      userKey,userType,userinterests,gender,languages,foodchoices,
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
      openDate,city,
      state,
      country,
      pinCode,
      securityDepositOption,
      amenities: parsedAmenities,
      cookingType,
      mapLocation,
      accommodationType,   // <-- added
      title                // <-- added
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

/*──────────────────────────  STATS ENDPOINT  ──────────────────
  NOTE: placed BEFORE '/:id' so it isn’t swallowed by that route */
router.get('/stats/:userKey', async (req, res) => {
  try {
    const listings = await Listing.find({ userKey: req.params.userKey });

    //  ⬇⬇ include locality and propertyStructure for the new charts
    const stats = listings.map(l => ({
      _id:               l._id,
      propertyAddress:   l.propertyAddress,
      locality:          l.locality,          // <-- NEW
      propertyStructure: l.propertyStructure, // <-- NEW
      viewsLog:          l.viewsLog || []
    }));

    res.json(stats);
  } catch (err) {
    console.error('Error building stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/*──────────────────────────  READ ONE & INCREMENT VIEWS  ─────*/

router.get('/:id', async (req, res) => {
  const viewer = req.query.viewer || null;

  const update = {
    $inc: { viewsCount: 1 },
    $push: {
      viewsLog: {
        date: new Date(),
        count: 1,
        viewer // ✅ include viewer identity
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