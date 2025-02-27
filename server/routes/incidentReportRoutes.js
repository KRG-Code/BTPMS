const express = require('express');
const { createIncidentReport } = require('../controllers/incidentReportController');

const router = express.Router();

// Route to create a new incident report
router.post('/', createIncidentReport);

module.exports = router;
