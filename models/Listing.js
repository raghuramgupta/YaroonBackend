// models/Listing.js
const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema(
  {
    /* ───────── BASIC INFO ───────── */
    title:              { type: String, required: true },
    accommodationType:  { type: String, required: true }, // “Room”, “Whole property” …
    description:        { type: String },

    /* ───────── ADDRESS / LOCATION ───────── */
    propertyAddress: { type: String, required: true },
    city:    String,foodchoices:String,
    state:   String,
    country: String,
    locality:String,
    pinCode:String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    propertyStructure: String, // Standalone apartment / building / Gated community
    roomType:          String, // 1BHK / 2BHK / 3BHK / Studio
    washroomType:      String, // Attached / Private / Sharing
    parkingType:       String, // Car parking / Bike parking / None
    roomSize:          Number, // sq ft
    apartmentSize:     Number, // sq ft
    cookingType:       String, //cooking type 
    /* ───────── PRICING / DATES ───────── */
    rent:          { type: Number, required: true },
    deposit:       Number,
    availableFrom: Date,
    openDate:      Date, // open‑house date/time
    securityDepositOption: String,
    /* ───────── MEDIA ───────── */
    images: [String],  // array of image URLs
    videos: [String],
    customSecurityDeposit:  String,
    /* ───────── AMENITIES / FILTERS ───────── */
    professionAllowed: [String],
    foodOptions:       [String],
    parking:           [String],
    languagesSpoken:   [String],
    userinterests:String,gender:String,languages:String,foodOptions:String,pets:String,
    amenities: {
      TV:             { type: Boolean, default: false },
      Fridge:         { type: Boolean, default: false },
      WashingMachine: { type: Boolean, default: false },
      kitchen:        { type: Boolean, default: false },
      AirConditioner: { type: Boolean, default: false },
      SwimmingPool:   { type: Boolean, default: false },
      Gym:            { type: Boolean, default: false },
      
      // add more toggles here when you introduce new ones
    },
    validPics: [Boolean],AIGenpics: [Boolean],
    /* ───────── OWNER / USER ───────── */
    userKey: { type: String, required: true }, // the ad owner’s key / auth ID
    userType: String,
    /* ───────── VIEW‑TRACKING ─────────
       Each time a listing is fetched you should
       1) increment viewsCount
       2) push { date: now, viewer: <viewerKey> }
       The viewer key lets us exclude the owner later.
    */
    viewsCount: { type: Number, default: 0 },
    viewsLog: [
      {
        date:   { type: Date,   required: true },
        viewer: { type: String }              // userKey (or “anonymous”)
      }
    ]
  },
  { timestamps: true } // createdAt & updatedAt
);

module.exports = mongoose.model('Listing', ListingSchema);