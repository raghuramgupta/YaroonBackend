const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ====================== SIGNUP ======================
router.post('/signup', async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if (!email && !mobile) {
      return res.status(400).json({ message: 'Email or mobile is required.' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      ...req.body,
      password: hashedPassword
    });

    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// ====================== LOGIN ======================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ email: username }, { mobile: username }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.status(200).json({
      message: 'Login successful',
      userKey: user.email || user.mobile
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// ====================== GET PROFILE ======================
router.get('/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Remove sensitive info
    delete user.password;

    res.status(200).json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ====================== UPDATE PROFILE ======================
router.put('/profile/:email', async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: req.params.email },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    delete updatedUser.password;

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// DELETE /api/listings/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Listing.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
