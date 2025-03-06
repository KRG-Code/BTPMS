const express = require('express');
const router = express.Router();
const assistanceIntegrationController = require('../controllers/assistanceIntegrationController');
const { validateAuth } = require('../middleware/apiKeyAuth');

// Secure all routes with validateAuth
router.get('/assistance', validateAuth, assistanceIntegrationController.getAllAssistance);
router.get('/assistance/:incidentId', validateAuth, assistanceIntegrationController.getAssistanceByIncidentId);
router.put('/assistance/:incidentId', validateAuth, assistanceIntegrationController.updateAssistanceStatus);
router.post('/assistance', validateAuth, assistanceIntegrationController.handleAssistanceOperation);

module.exports = router;
