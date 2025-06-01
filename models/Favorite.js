const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can't favorite the same listing multiple times
FavoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);