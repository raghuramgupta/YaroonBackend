const express = require('express');
const router = express.Router();
const Ticket = require('../models/SupportTicket');
const User = require('../models/staff');

// Get all tickets (filterable by status)
router.get('/', async (req, res) => {
  try {
    // Check if user is authenticated and has the right role
    if (!req.user || req.user.role !== 'Customer Service Lead') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign ticket to staff
router.put('/:id/assign', async (req, res) => {
  try {
    // Check if user is authenticated and has the right role
    if (!req.user || req.user.role !== 'Customer Service Lead') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { staffId } = req.body;
    
    // Verify the staff member exists and has the right role
    const staffMember = await User.findById(staffId);
    if (!staffMember || 
        !['Customer Service Lead', 'Customer Service'].includes(staffMember.role)) {
      return res.status(400).json({ message: 'Invalid staff member' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignedTo: staffId },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;