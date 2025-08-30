const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const Staff = require('../models/staff');

// Configure file upload storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/support/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Only images, videos, and documents are allowed!');
    }
  }
});

// Create a new support ticket with attachments
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, issueType, description, listingId, userId } = req.body;
    const files = req.files || [];

    // Validate required fields
    if (!title || !issueType || !description || !userId) {
      // Clean up uploaded files if validation fails
      files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'issueType', 'description', 'userId']
      });
    }

    // Process attachments
    const attachments = files.map(file => ({
      url: `/uploads/support/${file.filename}`,
      type: getFileType(file.mimetype),
      originalName: file.originalname
    }));

    const newTicket = new SupportTicket({
      title,
      issueType,
      listingId: issueType === 'Problem with a listing' ? listingId : null,
      description,
      userId,
      status: 'open',
      messages: [{
        senderType: 'user',
        senderId: userId,
        content: description,
        attachments
      }]
    });

    const savedTicket = await newTicket.save();
    
    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: savedTicket
    });

  } catch (error) {
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    
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

// Add a message to a ticket (with optional attachments)
router.post('/:id/messages', upload.array('attachments', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { senderType, senderId, content } = req.body;
    const files = req.files || [];

    // Validate required fields
    if (!senderType || !senderId || !content) {
      files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['senderType', 'senderId', 'content']
      });
    }

    if (!['user', 'staff'].includes(senderType)) {
      files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({ 
        error: 'Invalid sender type'
      });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      files.forEach(file => fs.unlinkSync(file.path));
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Verify permissions
    if (senderType === 'user' && ticket.userId !== senderId) {
      files.forEach(file => fs.unlinkSync(file.path));
      return res.status(403).json({ 
        error: 'Unauthorized - you can only message your own tickets'
      });
    }

    // Process attachments
    // In your POST route
    const attachments = files.map(file => ({
      url: `/uploads/support/${file.filename}`, // This is the public URL
      type: getFileType(file.mimetype),
      originalName: file.originalname,
      filepath: file.path // Store the actual file path for cleanup
    }));

    // Add new message
    ticket.messages.push({
      senderType,
      senderId,
      content,
      attachments
    });

    // Update ticket status if staff is responding
    if (senderType === 'staff' && ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    const updatedTicket = await ticket.save();
    
    res.json({
      message: 'Message added successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    
    console.error('Error adding message:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
router.get('/user/:userId', async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
// PUT /api/support/:ticketId - Update a ticket
router.put('/:ticketId', upload.any(), async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const formData = req.body || {};
    
    // Validate ticket exists
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update fields if they exist in the request
    if (formData.status !== undefined) ticket.status = formData.status;
    if (formData.notes !== undefined) ticket.assignmentNotes = formData.notes;
    
    // Handle assignment
    if (formData.assignedTo !== undefined) {
      if (formData.assignedTo && formData.assignedTo !== '') {
        const staff = await Staff.findById(formData.assignedTo);
        if (!staff) {
          return res.status(400).json({ error: 'Staff member not found' });
        }
        ticket.assignedTo = formData.assignedTo;
      } else {
        ticket.assignedTo = null;
      }
    }

    // Handle new message - with proper sender information
    if (formData.messageContent) {
      const newMessage = {
        content: formData.messageContent,
        timestamp: new Date(),
        senderId: req.user?._id || ticket.assignedTo || null, // Fallback to assignedTo if no user
        senderType: req.user?._id ? 'staff' : 'user' // Adjust based on your auth system
      };
      ticket.messages.push(newMessage);
    }

    // Handle file attachments
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        ticket.attachments.push({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype
        });
      });
    }

    const updatedTicket = await ticket.save();
    await updatedTicket.populate('assignedTo', 'name email role');
    
    res.json({ 
      message: 'Ticket updated successfully',
      ticket: updatedTicket 
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ 
      error: error.message || 'Error updating ticket',
      details: error.errors // Send validation errors to frontend
    });
  }
});
router.get('/all', async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Assign ticket to staff member
router.put('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    // Find the ticket and staff member
    const ticket = await SupportTicket.findById(id);
    const staff = await Staff.findById(staffId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Update the ticket
    ticket.assignedTo = staffId;
    if (ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    const updatedTicket = await ticket.save();

    res.json({
      message: 'Ticket assigned successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Get ticket with messages
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Verify user has access to this ticket
    if (userId && ticket.userId !== userId) {
      return res.status(403).json({ 
        error: 'Unauthorized - you can only view your own tickets'
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to determine file type
function getFileType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'document';
  if (mimetype.includes('document') || mimetype.includes('msword')) return 'document';
  return 'other';
}

// ... (keep all other existing routes from your original code)

module.exports = router;