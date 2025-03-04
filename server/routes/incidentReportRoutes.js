const express = require('express');
const { createIncidentReport, getIncidentReports } = require('../controllers/incidentReportController');

const router = express.Router();

// Route to create a new incident report
router.post('/', createIncidentReport);

// Route to get all incident reports
router.get('/', getIncidentReports);

module.exports = router;
