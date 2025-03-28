const jwt = require('jsonwebtoken');
const User = require('../models/User');
// Add import for TanodLocation model
const TanodLocation = require('../models/TanodLocation');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in the authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, return unauthorized error
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token is missing' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user and attach it to the request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // NEW CODE - Tracking functionality for tanod users
    if (req.user.userType === 'tanod') {
      // Check if they have an active location record
      const existingLocation = await TanodLocation.findOne({ userId: req.user.id });
      
      // If no location record exists, create one with default values
      if (!existingLocation) {
        await TanodLocation.create({
          userId: req.user.id,
          latitude: 0,
          longitude: 0,
          isActive: true,
          markerColor: 'red',
          isOnPatrol: false,
          lastUpdate: new Date()
        });
      } else if (!existingLocation.isActive) {
        // If location exists but is not active, reactivate it
        existingLocation.isActive = true;
        existingLocation.lastUpdate = new Date();
        await existingLocation.save();
      }
    }
    // END OF NEW CODE

    next(); // Proceed if token and user are valid
  } catch (error) {
    // Handle different token errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};
