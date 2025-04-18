const express = require('express');
const router = express.Router();
const residentsController = require('../controllers/residentsController');

// Register a new resident
router.post('/register', residentsController.register);

// Login route for residents
router.post('/login', residentsController.login);

// Add this new route for resident ID verification
router.get('/verify/:residentId', residentsController.verifyResidentById);

// Add this new route for verifying resident password
router.post('/verify-password', residentsController.verifyResidentPassword);

// Add route for requesting PIN reset
router.post('/reset-pin-request', residentsController.requestPinReset);

// Add route for resetting PIN with token
router.post('/reset-pin', residentsController.resetPin);

// Additional routes can be added here as needed:
// - Get resident profile
// - Update resident profile
// - Reset password
// - etc.

module.exports = router;
