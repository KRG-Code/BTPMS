const jwt = require('jsonwebtoken');
const User = require('../models/User');
// Add import for TanodLocation model
const TanodLocation = require('../models/TanodLocation');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token found, return 401
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id in token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      // Attach user to request object
      req.user = user;

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

      next();
    } catch (error) {
      console.error('Token validation error:', error);
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
