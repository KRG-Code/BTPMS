const express = require('express');
const router = express.Router();
const residentsController = require('../controllers/residentsController');

// Register a new resident
router.post('/register', residentsController.register);

// Login route for residents
router.post('/login', residentsController.login);

// Additional routes can be added here as needed:
// - Get resident profile
// - Update resident profile
// - Reset password
// - etc.

module.exports = router;
