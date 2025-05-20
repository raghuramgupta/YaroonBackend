const mongoose = require('mongoose');

const wantedListingSchema = new mongoose.Schema(
  {
    /* --- who created it --------------------------------------------------- */
    user: String,

    /* --- location --------------------------------------------------------- */
    preferredLocation: { type: String, required: true },         // full address
    locality: String,
    city:        { type: String, required: true },
    state:       { type: String, required: true },
    country:     String,
    pinCode:     String,
    mapLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      // GeoJSON [lng, lat] order
      coordinates: { type: [Number], index: '2dsphere' },
    },

    /* --- room preferences ------------------------------------------------- */
    propertyType: {
      type: String,
      enum: ['Apartment', 'Independent House', 'PG/Hostel', 'No Preference'],
      required: true,
    },
    roomType: {
      type: String,
      enum: ['Single Room', 'Shared Room'],
      required: true,
    },
    washroomType: {
      type: String,
      enum: ['Attached', 'Private', 'Sharing'],
      required: true,
    },
    furnished: {
      type: String,
      enum: ['Furnished', 'Semi-Furnished', 'Unfurnished', 'No Preference'],
      required: true,
    },
    foodChoice: {
      type: String,
      enum: ['Vegan', 'Vegetarian', 'No Preference'],
      default: 'No Preference',
    },
    profession:   String,
    budget:       { type: Number, required: true },              // per month
    moveInDate:   { type: Date },

    /* --- description ------------------------------------------------------ */
    description:  String,

    /* --- contact info ----------------------------------------------------- */
    contactName:  { type: String, required: true },
    contactPhone: String,
    contactEmail: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WantedListing', wantedListingSchema);
