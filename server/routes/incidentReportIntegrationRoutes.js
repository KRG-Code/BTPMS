const express = require('express');
const router = express.Router();
const { validateAuth } = require('../middleware/apiKeyAuth');
const {
  createIncidentReport,
  getIncidentReports,
  getIncidentReportById,
  getIncidentReportByTicket,
  updateIncidentReport
} = require('../controllers/incidentReportIntegrationController');

// Apply validation middleware to all routes
router.use(validateAuth);

// POST - Create a new incident report
router.post('/', createIncidentReport);

// GET - Get all incident reports with filtering
router.get('/', getIncidentReports);

// GET - Get incident report by ID
router.get('/:id', getIncidentReportById);

// GET - Get incident report by ticket ID
router.get('/ticket/:ticketId', getIncidentReportByTicket);

// PUT - Update incident report
router.put('/:id', updateIncidentReport);

module.exports = router;
