const express = require('express');
const { 
  createIncidentReport, 
  getIncidentReports, 
  updateIncidentStatus,
  getIncidentDetails
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

module.exports = router;
