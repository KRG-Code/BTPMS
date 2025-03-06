const express = require('express');
const router = express.Router();
const assistanceRequestController = require('../controllers/assistanceRequestController');
const { protect } = require('../middleware/authMiddleware');

// Create assistance request
router.post('/create', protect, assistanceRequestController.createAssistanceRequest);

// Get assistance request status
router.get('/:incidentId/status', protect, assistanceRequestController.getAssistanceStatus);

// Update assistance request status - ensure this route matches the client request
router.put('/:id/status', protect, assistanceRequestController.updateAssistanceStatus);

// Get all assistance requests (for admin)
router.get('/', protect, assistanceRequestController.getAllAssistanceRequests);

// Get assistance requests by user
router.get('/user/:userId', protect, assistanceRequestController.getAssistanceRequestsByUser);

module.exports = router;
