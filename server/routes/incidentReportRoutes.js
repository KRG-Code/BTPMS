const express = require('express');
const { 
  createIncidentReport, 
  getIncidentReports, 
  updateIncidentStatus,
  getIncidentDetails,
  getIncidentByTicketId,
  markAsFalseAlarm // Add this import
} = require('../controllers/incidentReportController');
const { protect } = require('../middleware/authMiddleware'); // Add this if not already imported

const router = express.Router();

// Route to create a new incident report
router.post('/', createIncidentReport);

// Route to get all incident reports
router.get('/', getIncidentReports);

// Update the route to match the client's request
router.put('/:id/status', updateIncidentStatus);

// Get incident details
router.get('/:id/details', getIncidentDetails);

// Get incident by ticket ID
router.get('/ticket/:ticketId', getIncidentByTicketId);

// Add this new route for marking an incident as a false alarm
router.put('/:id/false-alarm', protect, markAsFalseAlarm);

module.exports = router;
