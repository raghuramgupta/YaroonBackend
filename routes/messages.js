const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// POST /api/messages - Send a new message
router.post('/', async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      listingAddress,
      content,
      isRead,
      timestamp,
      replyToMessageId
    } = req.body;

    const newMessage = new Message({
      senderId,
      receiverId,
      listingAddress,
      content,
      isRead,
      timestamp,
      replyToMessageId: replyToMessageId || null
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this to your routes/listings.js or create a new messages.js route file
router.get('/messages/stats/:userKey', async (req, res) => {
  try {
    // First get all listings for this user
    const listings = await Listing.find({ userKey: req.params.userKey });
    
    // Then get message counts for each property
    const messagesPerProperty = await Message.aggregate([
      {
        $match: {
          propertyId: { $in: listings.map(l => l._id) }
        }
      },
      {
        $group: {
          _id: '$propertyId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'listings',
          localField: '_id',
          foreignField: '_id',
          as: 'property'
        }
      },
      {
        $unwind: '$property'
      },
      {
        $project: {
          propertyId: '$_id',
          propertyName: '$property.propertyAddress',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get total message count
    const totalMessages = messagesPerProperty.reduce((sum, item) => sum + item.count, 0);

    res.json({
      totalMessages,
      messagesPerProperty
    });
  } catch (err) {
    console.error('Error fetching message stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/messages/received/:userId - Messages received by user
router.get('/received/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const receivedMessages = await Message.find({ receiverId: userId }).sort({ timestamp: -1 });
    res.status(200).json(receivedMessages);
  } catch (err) {
    console.error('Error fetching received messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ ADD THIS: GET /api/messages/sent/:userId - Messages sent by user
router.get('/sent/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const sentMessages = await Message.find({ senderId: userId }).sort({ timestamp: -1 });
    res.status(200).json(sentMessages);
  } catch (err) {
    console.error('Error fetching sent messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Assuming this is the route handler for fetching messages
router.post('/read/:messageId', async (req, res) => {
  const messageId = req.params.messageId;
  try {
    // Assuming you have a Message model to update the 'read' status
    const message = await Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message marked as read', message });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as read', details: err.message });
  }
});

module.exports = router;
