const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your authentication middleware

// @route   GET api/auth/current-user
// @desc    Get current logged in user
// @access  Private
router.get('/current-user', auth, async (req, res) => {
  try {
    // The user should be available in req.user if your auth middleware sets it
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Return only necessary user data (don't send password)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
      // Add other fields you need
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;