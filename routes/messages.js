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
