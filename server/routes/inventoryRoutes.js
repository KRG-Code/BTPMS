const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const inventoryController = require('../controllers/inventoryController');
const router = express.Router();

// Route for getting the inventory audit report
router.get('/audit-report', protect, inventoryController.generateAuditReport);

// Route for combined audit report
router.get('/combined-audit-report', protect, inventoryController.generateCombinedAuditReport);

// Remove the problematic route until we implement the controller function
// router.post('/save-audit-report', protect, inventoryController.saveAuditReport);

module.exports = router;
