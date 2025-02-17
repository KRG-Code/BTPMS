const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
