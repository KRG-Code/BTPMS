const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const vehicleController = require('../controllers/vehicleController');



// API logging middleware to troubleshoot route calls
router.use((req, res, next) => {
  console.log(`Vehicle API called: ${req.method} ${req.originalUrl}`);
  next();
});

// Get all vehicles
router.get('/', protect, vehicleController.getAllVehicles);

// Get vehicles assigned to a specific user
router.get('/assigned-to/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Finding vehicles assigned to driver ${userId}`);
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`Invalid userId format: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Find vehicles where this user is assigned as a driver
    const Vehicle = mongoose.model('Vehicle');
    
    // Log all vehicles in the database to help debug
    console.log("Debugging all vehicles in database:");
    const allVehicles = await Vehicle.find().lean();
    allVehicles.forEach(v => {
      console.log(`Vehicle ${v.name} (${v.licensePlate}): driver=${v.assignedDriver}, type=${typeof v.assignedDriver}`);
    });
    
    // Perform the query with both string and ObjectId comparison
    const vehicles = await Vehicle.find({
      $or: [
        { assignedDriver: userId },
        { assignedDriver: new mongoose.Types.ObjectId(userId) }
      ]
    }).populate('assignedDriver', 'firstName lastName profilePicture');
    
    console.log(`Found ${vehicles.length} vehicles assigned to user ${userId}`);
    
    // Log all vehicles found 
    vehicles.forEach(v => {
      console.log(`- Vehicle: ${v.name}, License: ${v.licensePlate}, ID: ${v._id}`);
    });
    
    res.status(200).json(vehicles);
  } catch (error) {
    console.error(`Error fetching vehicles for user ${req.params.userId}:`, error);
    res.status(500).json({ message: 'Failed to fetch vehicles', error: error.message });
  }
});

// Vehicle request routes
router.post('/requests', protect, vehicleController.createVehicleRequest);
router.get('/requests/all', protect, vehicleController.getAllVehicleRequests);
router.get('/requests/:id', protect, vehicleController.getVehicleRequestById);
router.get('/requests', protect, vehicleController.getAllVehicleRequests);
router.get('/requests/count', protect, vehicleController.getVehicleRequestsCount);
router.put('/requests/:id/approve', protect, vehicleController.approveVehicleRequest);
router.put('/requests/:id/reject', protect, vehicleController.rejectVehicleRequest);
router.put('/requests/:id/complete', protect, vehicleController.completeVehicleRequest);

// Test route to validate vehicle requests without saving
router.post('/requests/validate', protect, (req, res) => {
  console.log("Body received:", req.body);
  
  const { vehicleId, requesterId, startMileage, date, destination, reason } = req.body;
  
  // Log each field
  console.log("vehicleId:", vehicleId);
  console.log("requesterId:", requesterId);
  console.log("startMileage:", startMileage);
  console.log("date:", date);
  console.log("destination:", destination);
  console.log("reason:", reason);
  
  const missing = [];
  if (!vehicleId) missing.push('vehicleId');
  if (!requesterId) missing.push('requesterId');
  if (startMileage === undefined) missing.push('startMileage');
  if (!date) missing.push('date');
  if (!destination) missing.push('destination');
  if (!reason) missing.push('reason');
  
  if (missing.length > 0) {
    return res.status(400).json({ 
      message: `Missing required fields: ${missing.join(', ')}`,
      received: req.body 
    });
  }
  
  res.status(200).json({ 
    valid: true, 
    message: 'All required fields present',
    data: { vehicleId, requesterId, startMileage, date, destination, reason }
  });
});

// Add this new route for updating vehicle status
router.put('/:id/status', protect, vehicleController.updateVehicleStatus);

// Route to update vehicle condition
router.put('/:vehicleId/condition', protect, vehicleController.updateVehicleCondition);

// Add this route to get all vehicle usages for a specific user
router.get('/usages/user/:userId', protect, vehicleController.getVehicleUsagesForUser);

// Add new routes for audit reports
router.get('/audit-report', protect, vehicleController.generateAuditReport);

// Add route for generating vehicle audit report
router.get('/audit-report', protect, vehicleController.generateAuditReport);

// Other existing routes
router.get('/:id', protect, vehicleController.getVehicleById);
router.get('/:id/usage', protect, vehicleController.getVehicleUsageHistory);
router.post('/', protect, vehicleController.createVehicle);
router.put('/:id', protect, vehicleController.updateVehicle);
router.delete('/:id', protect, vehicleController.deleteVehicle);
router.put('/:id/assign-driver', protect, vehicleController.assignDriverToVehicle);
router.put('/:id/remove-driver', protect, vehicleController.removeDriverFromVehicle);
router.post('/:id/usage', protect, vehicleController.recordVehicleUsage);

module.exports = router;
