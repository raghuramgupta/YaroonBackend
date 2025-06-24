const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true
  },
  listingAddress: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  replyToMessageId: {
    type: String, // or type: mongoose.Schema.Types.ObjectId if you prefer references
    default: null
  }
});

module.exports = mongoose.model('Message', messageSchema);
