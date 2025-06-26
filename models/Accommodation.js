const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomTypeSchema = new Schema({
  type: {
    type: String,
    enum: ['Single', 'Double Sharing', 'Multi Sharing', 'Studio'],
    required: true
  },
  facilities: [{
    name: String,
    available: Boolean
  }],
  totalRooms: {
    type: Number,
    required: true,
    min: 1
  },
  vacantRooms: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true
  }
});

const mealOptionSchema = new Schema({
  breakfast: Boolean,
  lunch: Boolean,
  dinner: Boolean,
  packedLunch: Boolean,
  cuisines: [{
    type: String,
    enum: ['South Indian', 'North Indian', 'Continental', 'Chinese', 'Veg', 'Non-Veg']
  }]
});

const accommodationSchema = new Schema({
  owner: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['PG', 'Co-Living'],
    required: true
  },
  address: {
    street: String,
    locality: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number]
      }
    }
  },
  totalFloors: {
    type: String,
    required: true,
    min: 1
  },
  roomTypes: [roomTypeSchema],
  commonFacilities: [{
    name: String,
    available: Boolean
  }],
  meals: mealOptionSchema,
  images: [{
    path: String,
    filename: String,
    mimetype: String
  }],
  videos: [String],
  rules: [String],
  contactNumber: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location-based searches
accommodationSchema.index({ 'address.coordinates': '2dsphere' });

module.exports = mongoose.model('Accommodation', accommodationSchema);