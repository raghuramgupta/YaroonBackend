const express = require('express');
const router = express.Router();
const Staff = require('../models/staff');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// @route   POST /api/staff/register
// @desc    Register a staff member
// @access  Public
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let staff = await Staff.findOne({ email });

    if (staff) {
      return res.status(400).json({ msg: 'Staff already exists' });
    }

    staff = new Staff({
      name,
      email,
      password
    });

    await staff.save();

    const payload = {
      staff: {
        id: staff.id,
        role: staff.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
router.get('/me', async (req, res) => {
  try {
    const staff = await Staff.findOne({email}).select('-password');
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// @route   POST /api/staff/login
// @desc    Authenticate staff & get token
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await staff.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      staff: {
        id: staff.id,
        role: staff.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;