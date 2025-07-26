const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderType: {
    type: String,
    required: true,
    enum: ['user', 'staff']
  },
  senderId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'other']
    },
    originalName: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SupportTicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: [5, 'Title should be at least 5 characters long']
  },
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
  assignedTo: {
    type: String
  },
  assignmentHistory: [{
    assignedTo: { type: String },
    previousAssignment: {
      staff: { type: String },
      status: String,
      timestamp: Date
    },
    notes: String,
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= this.createdAt;
      },
      message: 'Resolved date must be after creation date'
    }
  }
}, {
  timestamps: true
});

// Add text index for search functionality
SupportTicketSchema.index({ title: 'text', description: 'text', issueType: 'text' });

// Add a virtual property for ticket ID
SupportTicketSchema.virtual('ticketId').get(function() {
  return this._id.toString().slice(-6).toUpperCase();
});

// Pre-save hook to update timestamps
SupportTicketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);