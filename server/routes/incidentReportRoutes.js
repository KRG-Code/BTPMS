const express = require('express');
const { 
  createIncidentReport, 
  getIncidentReports, 
  updateIncidentStatus,
  getIncidentDetails,
  getIncidentByTicketId
} = require('../controllers/incidentReportController');

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

module.exports = router;
