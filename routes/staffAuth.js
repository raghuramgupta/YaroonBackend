const express = require('express');
const router = express.Router();
const Staff = require('../models/staff');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Ticket = require('../models/SupportTicket');
// Staff Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    
    // Check if staff already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'Staff already exists' });
    }

    // Create new staff
    const staff = new Staff({ name, email, password, department });
    await staff.save();

    res.status(201).json({ success: true, message: 'Staff registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all staff members (Customer Service Lead and Customer Service)
router.get('/staff', async (req, res) => {
  try {
    const staffMembers = await Staff.find({
      role: { $in: ['Customer Service Lead', 'Customer Service'] }
    }).select('name email role');

    res.json(staffMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all employees
router.get('/all', async (req, res) => {
  try {
    const employees = await Staff.find({}, { password: 0, __v: 0 });
    if (!Array.isArray(employees)) {
      throw new Error('Failed to fetch employees data');
    }
    res.status(200).json({ 
      success: true, 
      data: employees 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalListings,
      totalUsers,
      todayListings,
      activeListings,
      weeklyListings,
      monthlyListings,
      weeklyUsers,
      monthlyUsers,
      listingsByCity,
      usersByLocation,
      openTickets,
      inProgressTickets,
      resolvedTickets
    ] = await Promise.all([
      Listing.countDocuments(),
      User.countDocuments(),
      Listing.countDocuments({ createdAt: { $gte: today } }),
      Listing.countDocuments({ status: 'active' }),
      Listing.countDocuments({ createdAt: { $gte: weekAgo } }),
      Listing.countDocuments({ createdAt: { $gte: monthAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      Listing.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      User.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'in-progress' }),
      Ticket.countDocuments({ status: 'Resolved' })
    ]);

    res.json({
      totalListings,
      totalUsers,
      todayListings,
      activeListings,
      weeklyListings,
      monthlyListings,
      weeklyUsers,
      monthlyUsers,
      listingsByCity,
      usersByLocation,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      totalTickets: openTickets + inProgressTickets + resolvedTickets
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Staff Login (modified to return success without auth)
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find staff
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(200).json({ success: true, message: 'Login simulation successful' });
    }

    res.json({ success: true, message: 'Login simulation successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assign/Update Staff Role
router.post('/assign-role', async (req, res) => {
  try {
    const { email, role } = req.body;

    // Validate input
    if (!email || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and role are required' 
      });
    }

    // Check if staff exists
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }

    // Update role
    staff.role = role;
    await staff.save();

    res.status(200).json({ 
      success: true, 
      message: 'Role updated successfully',
      data: {
        name: staff.name,
        email: staff.email,
        newRole: staff.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;