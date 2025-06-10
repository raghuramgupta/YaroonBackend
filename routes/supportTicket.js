const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');

// Create a new support ticket (no auth required)
router.post('/', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
    const { issueType, description, listingId, userId } = req.body;

    // Validate required fields
    if (!issueType || !description || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['issueType', 'description', 'userId']
      });
    }

    const newTicket = new SupportTicket({
      issueType,
      listingId: issueType === 'Problem with a listing' ? listingId : null,
      description,
      userId,
      status: 'open'
    });

    const savedTicket = await newTicket.save();
    
    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: savedTicket
    });

  } catch (error) {
    console.error('Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a support ticket
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { issueType, description, listingId, userId } = req.body;

    // Validate required fields
    if (!issueType || !description || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['issueType', 'description', 'userId']
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only allow updates to open tickets
    if (ticket.status !== 'open') {
      return res.status(400).json({ 
        error: 'Only open tickets can be updated'
      });
    }

    // Verify user owns the ticket
    if (ticket.userId !== userId) {
      return res.status(403).json({ 
        error: 'Unauthorized - you can only update your own tickets'
      });
    }

    ticket.issueType = issueType;
    ticket.description = description;
    ticket.listingId = issueType === 'Problem with a listing' ? listingId : null;
    ticket.updatedAt = new Date();

    const updatedTicket = await ticket.save();
    
    res.json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Error updating ticket:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a support ticket
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Get userId from query params

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
      console.log("In user id loop");
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
      console.log("Ticket not found");
    }

    // Verify user owns the ticket
    if (ticket.userId !== userId) {
      return res.status(403).json({ 
        error: 'Unauthorized - you can only delete your own tickets'
      });
    }
    console.log("In user id loop");
    // Only allow deletion of open tickets
    if (ticket.status !== 'open') {
      return res.status(400).json({ 
        error: 'Only open tickets can be deleted'
      });
      console.log("In open id loop");
    }

    await SupportTicket.findByIdAndDelete(id);
    
    res.json({
      message: 'Ticket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting :', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all tickets for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const tickets = await SupportTicket.find({ userId }).sort({ createdAt: -1 });
    
    res.json({
      count: tickets.length,
      tickets
    });
    
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ 
      error: 'Error fetching user tickets',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all tickets (no auth required - careful with this in production!)
router.get('/all', async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tickets' });
  }
});

// Get open tickets for a specific user
router.get('/user/:userId/open', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const tickets = await SupportTicket.find({ 
      userId,
      status: 'open'
    }).sort({ createdAt: -1 });
    
    res.json({
      count: tickets.length,
      tickets
    });
    
  } catch (error) {
    console.error('Error fetching open tickets:', error);
    res.status(500).json({ 
      error: 'Error fetching open tickets',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;