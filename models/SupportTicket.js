  // models/SupportTicket.js
  const mongoose = require('mongoose');

  const SupportTicketSchema = new mongoose.Schema({
    issueType: {
      type: String,
      required: [true, 'Issue type is required'],
      enum: {
        values: [
          'Problem with a listing',
          "Can't create a listing",
          'Account issues',
          'Payment problems',
          'Other'
        ],
        message: '{VALUE} is not a valid issue type'
      }
    },
    listingId: {
      type: String,
      required: function() {
        return this.issueType === 'Problem with a listing';
      }
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description should be at least 10 characters long']
    },
    userId: {
      type: String,
      required: [true, 'User ID is required']
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date,
      validate: {
        validator: function(value) {
          // resolvedAt must be after createdAt if provided
          return !value || value >= this.createdAt;
        },
        message: 'Resolved date must be after creation date'
      }
    }
  }, {
    timestamps: true // Adds createdAt and updatedAt automatically
  });

  // Add text index for search functionality
  SupportTicketSchema.index({ description: 'text', issueType: 'text'});

  module.exports = mongoose.model('SupportTicket', SupportTicketSchema);