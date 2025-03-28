const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Public endpoint to get tanod users
router.get('/', async (req, res) => {
  try {
    const tanods = await User.find({ userType: 'tanod' })
      .select('_id firstName lastName profilePicture')
      .sort({ firstName: 1 });
    
    console.log(`Serving ${tanods.length} tanod users via public route`);
    res.status(200).json(tanods);
  } catch (error) {
    console.error('Error fetching public tanod list:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
