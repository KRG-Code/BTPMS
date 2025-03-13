const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  updateLocation,
  getActiveLocations,
  deactivateLocation,
  updatePatrolStatus
} = require('../controllers/tanodLocationController');

// These paths will be relative to /api/locations
router.post('/update', protect, updateLocation);
router.get('/active', protect, getActiveLocations);
router.post('/deactivate', protect, deactivateLocation);
router.post('/patrol-status', protect, updatePatrolStatus);

module.exports = router;
