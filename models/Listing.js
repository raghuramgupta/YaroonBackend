const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  userKey: String,
  propertyAddress: String,
  locality: String,
  propertyStructure: String,
  roomType: String,
  washroomType: String,
  parkingType: String,
  roomSize: Number,
  apartmentSize: Number,
  rent: Number,
  availableFrom: String,
  openDate: String,
  securityDeposit: String,
  amenities: {
    TV: Boolean,
    Fridge: Boolean,
    WashingMachine: Boolean,
    kitchen: Boolean
  },
  cookingType: String,
  mapLocation: String
});

module.exports = mongoose.model('Listing', listingSchema);
