const Vehicle = require("../models/Vehicle");
const VehicleUsage = require('../models/VehicleUsage');
const User = require("../models/User");
const VehicleRequest = require('../models/VehicleRequest');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { getIO } = require('../websocket');

// Helper Functions
const sendWebSocketUpdate = (event, data, action = 'update') => {
  try {
    const io = getIO();
    if (io) {
      // Broadcast to relevant rooms
      if (event === 'vehicleUpdate') {
        io.to('vehicles').emit('vehicleStatusUpdate', {
          type: 'vehicleStatusUpdate',
          vehicle: data
        });
      } else if (event === 'requestUpdate') {
        io.to('vehicle-requests').emit('vehicleRequestUpdate', {
          type: 'vehicleRequestUpdate',
          request: data,
          action: action
        });

        // Also notify the requester specifically
        if (data.requesterId) {
          const requesterId = data.requesterId._id || data.requesterId;
          io.to(`user-${requesterId}`).emit('vehicleRequestUpdate', {
            type: 'vehicleRequestUpdate',
            request: data,
            action: action
          });
        }
      }
    }
  } catch (error) {
    console.error('Error sending WebSocket update:', error);
  }
};

const createNotification = async (userId, message) => {
  try {
    await Notification.create({
      userId,
      message,
      read: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Update vehicle status based on condition
const updateVehicleStatusFromCondition = (vehicle, condition) => {
  switch (condition) {
    case 'Needs minor maintenance':
    case 'Needs major maintenance':
      vehicle.status = 'Under Maintenance';
      break;
    case 'Not operational':
      vehicle.status = 'Out of Service';
      break;
    case 'Good condition':
      // Only change to Available if it's not currently in use
      if (vehicle.status !== 'In Use') {
        vehicle.status = 'Available';
      }
      break;
  }
  
  vehicle.condition = condition;
  return vehicle;
};

//----------------------------------------
// Vehicle CRUD Operations
//----------------------------------------

// Get all vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    // Populate the assignedDriver field with selected user data
    const vehicles = await Vehicle.find()
      .populate('assignedDriver', 'firstName lastName profilePicture');
    
    res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
};

// Get vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedDriver', 'firstName lastName profilePicture');
    
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Failed to fetch vehicle" });
  }
};

// Add new vehicle
exports.createVehicle = exports.addVehicle = async (req, res) => {
  try {
    const { name, type, licensePlate, model, year, color, currentMileage, status, assignedDriver, imageUrl } = req.body;
    
    // Check if license plate is already in use
    const existingVehicle = await Vehicle.findOne({ licensePlate });
    if (existingVehicle) {
      return res.status(400).json({ message: "A vehicle with this license plate already exists" });
    }
    
    // Create new vehicle - generate a vehicleId if not provided in the request body
    const newVehicle = new Vehicle({
      name,
      type,
      licensePlate,
      model,
      year,
      color,
      currentMileage: currentMileage || 0,
      status: status || "Available",
      assignedDriver: assignedDriver || null,
      imageUrl: imageUrl || null,
      // We don't set vehicleId here since the model will auto-generate it
      // This prevents the null value issue
    });
    
    const savedVehicle = await newVehicle.save();
    
    // If there is an assigned driver, populate the driver details
    if (savedVehicle.assignedDriver) {
      await savedVehicle.populate('assignedDriver', 'firstName lastName profilePicture');
    }
    
    res.status(201).json(savedVehicle);
  } catch (error) {
    console.error("Error adding vehicle:", error);
    res.status(500).json({ message: "Failed to add vehicle", error: error.message });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, vehicleId, type, licensePlate, model, year, color, currentMileage, status, assignedDriver, imageUrl } = req.body;
    
    // Check if license plate is already in use by another vehicle
    if (licensePlate) {
      const existingVehicle = await Vehicle.findOne({ 
        licensePlate, 
        _id: { $ne: id } // Exclude the current vehicle from the check
      });
      
      if (existingVehicle) {
        return res.status(400).json({ message: "A vehicle with this license plate already exists" });
      }
    }
    
    // Check if vehicle ID is provided and already in use by another vehicle
    if (vehicleId) {
      const existingVehicleId = await Vehicle.findOne({ 
        vehicleId, 
        _id: { $ne: id } // Exclude the current vehicle from the check
      });
      
      if (existingVehicleId) {
        return res.status(400).json({ message: "A vehicle with this Vehicle ID already exists" });
      }
    }
    
    // Update the vehicle - only include vehicleId in the update if it was explicitly provided
    const updateFields = { 
      name, 
      type, 
      licensePlate, 
      model, 
      year, 
      color, 
      currentMileage, 
      status, 
      assignedDriver, 
      imageUrl 
    };
    
    // Only include vehicleId in the update if it was explicitly provided
    if (vehicleId) {
      updateFields.vehicleId = vehicleId;
    }
    
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateFields,
      { new: true } // Return the updated document
    ).populate('assignedDriver', 'firstName lastName profilePicture');
    
    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    // Send WebSocket update
    sendWebSocketUpdate('vehicleUpdate', updatedVehicle);
    
    res.status(200).json(updatedVehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Failed to update vehicle" });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Delete all usage records for this vehicle
    await VehicleUsage.deleteMany({ vehicleId: req.params.id });
    
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
};

//----------------------------------------
// Vehicle Assignment Operations
//----------------------------------------

// Assign driver to vehicle
exports.assignDriverToVehicle = async (req, res) => {
  try {
    const { driverId } = req.body;
    
    // Check if user exists and is a tanod
    let driver = null;
    if (driverId) {
      driver = await User.findById(driverId);
      if (!driver || driver.userType !== 'tanod') {
        return res.status(400).json({ message: 'Invalid driver' });
      }
    }
    
    // Update vehicle - don't change the status when assigning a driver
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { assignedDriver: driverId },
      { new: true }
    ).populate('assignedDriver', 'firstName lastName profilePicture');
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Send WebSocket update
    sendWebSocketUpdate('vehicleUpdate', vehicle);
    
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error assigning driver:", error);
    res.status(400).json({ message: error.message });
  }
};

// Remove driver from vehicle
exports.removeDriverFromVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { assignedDriver: null },
      { new: true }
    ).populate('assignedDriver', 'firstName lastName profilePicture');
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Send WebSocket update
    sendWebSocketUpdate('vehicleUpdate', vehicle);
    
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error removing driver:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get vehicles assigned to a specific driver
exports.getVehiclesAssignedToUser = exports.getAssignedVehicles = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Enhanced debugging to trace the request
    console.log(`🔍 Looking for vehicles assigned to user: ${userId}`);
    
    // Check if userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`❌ Invalid userId format: ${userId}`);
      return res.status(400).json({ message: 'Invalid userId' });
    }

    // Convert userId to ObjectId for proper comparison
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Find all vehicles where this user is assigned as driver
    const vehicles = await Vehicle.find({ assignedDriver: userObjectId })
      .populate('assignedDriver', 'firstName lastName profilePicture');
    
    console.log(`📊 Found ${vehicles.length} vehicles for driver ${userId}`);
    
    res.status(200).json(vehicles);
  } catch (error) {
    console.error(`Error fetching vehicles for user ${req.params.userId}:`, error);
    res.status(500).json({ message: 'Failed to fetch vehicles', error: error.message });
  }
};

//----------------------------------------
// Vehicle Usage Operations
//----------------------------------------

// Record vehicle usage
exports.recordVehicleUsage = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { startMileage, endMileage, mileageUsed, date, destination, notes, status } = req.body;
    
    // Validate vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Validate user is assigned to this vehicle - convert IDs to strings for comparison
    const vehicleDriverId = vehicle.assignedDriver ? vehicle.assignedDriver.toString() : null;
    const currentUserId = req.user._id.toString();
    
    if (!vehicleDriverId || vehicleDriverId !== currentUserId) {
      console.log("❌ Authentication failed - User ID mismatch:");
      console.log(`Vehicle driver ID: ${vehicleDriverId}`);
      console.log(`Current user ID: ${currentUserId}`);
      
      return res.status(403).json({ 
        message: 'You are not authorized to record usage for this vehicle',
        vehicleAssignedTo: vehicleDriverId,
        yourUserId: currentUserId
      });
    }
    
    // Create usage record
    const usage = new VehicleUsage({
      vehicleId,
      userId: req.user._id,
      driverId: req.user._id,
      startMileage: parseFloat(startMileage),
      endMileage: parseFloat(endMileage),
      mileageUsed: parseFloat(mileageUsed),
      date: new Date(date),
      destination,
      notes,
      status
    });
    
    await usage.save();
    
    // Update vehicle's current mileage
    vehicle.currentMileage = parseFloat(endMileage);
    
    // If maintenance needed, update vehicle status
    if (status === 'Needs major maintenance' || status === 'Not operational') {
      vehicle.status = 'Maintenance';
    }
    
    await vehicle.save();
    
    // Send WebSocket update
    sendWebSocketUpdate('vehicleUpdate', vehicle);
    
    res.status(201).json(usage);
  } catch (error) {
    console.error('Error recording vehicle usage:', error);
    res.status(500).json({ 
      message: 'Error recording vehicle usage', 
      error: error.message 
    });
  }
};

// Get usage history for a vehicle
exports.getVehicleUsageHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    // Find all usage records for this vehicle
    const usageHistory = await VehicleUsage.find({ vehicleId })
      .sort({ date: -1 })
      .limit(50); // Limit to recent 50 entries
    
    res.status(200).json(usageHistory);
  } catch (error) {
    console.error('Error fetching vehicle usage history:', error);
    res.status(500).json({ 
      message: 'Error fetching vehicle usage history', 
      error: error.message 
    });
  }
};

//----------------------------------------
// Vehicle Status & Condition Operations
//----------------------------------------

// Update vehicle status
exports.updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, condition, currentMileage, currentUserId } = req.body;

    // Validate request
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Find the vehicle
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Update status
    vehicle.status = status;
    
    // Update optional fields if provided
    if (condition) vehicle.condition = condition;
    if (currentMileage) vehicle.currentMileage = currentMileage;
    
    // If currentUserId is explicitly provided (including null)
    if (currentUserId !== undefined) {
      vehicle.currentUserId = currentUserId;
    }

    // Save the vehicle
    await vehicle.save();
    
    // Send WebSocket update
    sendWebSocketUpdate('vehicleUpdate', vehicle);

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    res.status(500).json({ message: "Error updating vehicle status", error: error.message });
  }
};

// Update vehicle condition
exports.updateVehicleCondition = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { condition, status } = req.body;
    
    if (!condition) {
      return res.status(400).json({ message: "Condition is required" });
    }
    
    // Find the vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    // Update condition
    vehicle.condition = condition;
    
    // If status is provided, update it too; otherwise derive it from condition
    if (status) {
      vehicle.status = status;
    } else {
      // Derive status from condition if not explicitly provided
      updateVehicleStatusFromCondition(vehicle, condition);
    }
    
    // Save the updated vehicle
    await vehicle.save();
    
    // Send WebSocket update
    sendWebSocketUpdate('vehicleUpdate', vehicle);
    
    // Return the updated vehicle
    res.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle condition:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//----------------------------------------
// Vehicle Request Operations
//----------------------------------------

// Create a vehicle request
exports.createVehicleRequest = async (req, res) => {
  try {
    const { vehicleId, requesterId, startMileage, destination, reason, date, notes, 
            destinationCoordinates, startTime, endTime } = req.body;

    // Create the request
    const vehicleRequest = new VehicleRequest({
      vehicleId,
      requesterId,
      startMileage,
      destination,
      reason,
      date,
      notes,
      destinationCoordinates,
      startTime,
      endTime
    });

    // Save to database
    const savedRequest = await vehicleRequest.save();
    
    // Populate the requester information for WebSocket broadcast
    const populatedRequest = await VehicleRequest.findById(savedRequest._id)
      .populate('vehicleId')
      .populate('requesterId', 'firstName lastName profilePicture');
    
    // Use our existing sendWebSocketUpdate function instead:
    sendWebSocketUpdate('requestUpdate', populatedRequest);

    // Send response
    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Error creating vehicle request:', error);
    res.status(500).json({ message: 'Error creating vehicle request', error: error.message });
  }
};

// Request a vehicle
exports.requestVehicle = async (req, res) => {
  try {
    const { vehicleId, startMileage, date, startTime, destination, reason, destinationCoordinates, notes } = req.body;
    
    // Validate required fields
    if (!vehicleId || !startMileage || !date || !destination || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verify the date is not in the past
    const requestDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    if (requestDate < today) {
      return res.status(400).json({ message: 'Cannot request a vehicle for past dates' });
    }
    
    // Find the vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Validate startMileage against current mileage
    if (parseFloat(startMileage) < vehicle.currentMileage) {
      return res.status(400).json({ 
        message: `Start mileage cannot be less than vehicle's current mileage (${vehicle.currentMileage})` 
      });
    }
    
    // Create the request - note we're no longer expecting endTime
    const vehicleRequest = new VehicleRequest({
      vehicleId,
      requesterId: req.user._id,
      startMileage: parseFloat(startMileage),
      date: date,
      startTime: startTime || date, // Use explicit startTime or fallback to date
      destination,
      reason,
      notes,
      status: 'Pending'
    });
    
    // Add coordinates if provided
    if (destinationCoordinates) {
      vehicleRequest.destinationCoordinates = destinationCoordinates;
    }
    
    await vehicleRequest.save();
    
    // Populate reference fields for the response
    const populatedRequest = await VehicleRequest.findById(vehicleRequest._id)
      .populate('vehicleId', 'name licensePlate model type imageUrl')
      .populate('requesterId', 'firstName lastName profilePicture');
    
    // Send WebSocket update
    sendWebSocketUpdate('requestUpdate', populatedRequest, 'insert');
    
    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Error requesting vehicle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all vehicle requests
exports.getVehicleRequests = async (req, res) => {
  try {
    const { status, userId, vehicleId } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (userId) {
      filter.requesterId = userId;
    }
    
    if (vehicleId) {
      filter.vehicleId = vehicleId;
    }
    
    // If the user is not an admin, they can only see their own requests
    if (req.user.userType !== 'admin') {
      filter.requesterId = req.user._id;
    }

    // Get requests with populated references
    const vehicleRequests = await VehicleRequest.find(filter)
      .populate('vehicleId', 'name licensePlate model type imageUrl')
      .populate('requesterId', 'firstName lastName profilePicture')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(vehicleRequests);
  } catch (error) {
    console.error('Error fetching vehicle requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get the count of vehicle requests by status
exports.getVehicleRequestsCount = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    // If the user is not an admin, they can only see their own requests
    if (req.user.userType !== 'admin') {
      filter.requesterId = req.user._id;
    }

    const count = await VehicleRequest.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    console.error('Error counting vehicle requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single vehicle request by ID
exports.getVehicleRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Special case for 'all' - return all requests instead of looking for a specific ID
    if (id === 'all') {
      // Get all requests, possibly with some filtering
      let query = {};
      
      // If user is not admin, only show their own requests
      if (req.user.userType !== 'admin') {
        query.requesterId = req.user._id;
      }
      
      const requests = await VehicleRequest.find(query)
        .populate('vehicleId', 'name licensePlate model type imageUrl')
        .populate('requesterId', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 });
      
      return res.json(requests);
    }
    
    // Regular case - find by ID
    const request = await VehicleRequest.findById(id)
      .populate('vehicleId', 'name licensePlate model type imageUrl')
      .populate('requesterId', 'firstName lastName profilePicture');
    
    if (!request) {
      return res.status(404).json({ message: 'Vehicle request not found' });
    }
    
    // If user is not admin and not the requester, deny access
    if (req.user.userType !== 'admin' && 
        request.requesterId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error fetching vehicle request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all vehicle requests
exports.getAllVehicleRequests = async (req, res) => {
  try {
    let query = {};
    
    // Filter by user if userId is provided in the query
    if (req.query.userId) {
      query.requesterId = req.query.userId;
    }
    // Admin can see all requests, others only see their own
    else if (req.user.userType !== 'admin') {
      query.requesterId = req.user._id;
    }
    
    // Additional filters can be added here
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const requests = await VehicleRequest.find(query)
      .populate('vehicleId', 'name licensePlate model type imageUrl')
      .populate('requesterId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching vehicle requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve a vehicle request
exports.approveVehicleRequest = async (req, res) => {
  try {
    // Only admins can approve requests
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to approve requests' });
    }

    const vehicleRequest = await VehicleRequest.findById(req.params.id);
    if (!vehicleRequest) {
      return res.status(404).json({ message: 'Vehicle request not found' });
    }

    // Check if the request is already approved or rejected
    if (vehicleRequest.status !== 'Pending') {
      return res.status(400).json({ 
        message: `Cannot approve request that is already ${vehicleRequest.status.toLowerCase()}`
      });
    }
    
    // Update the request status
    vehicleRequest.status = 'Approved';
    vehicleRequest.approvedBy = req.user._id;
    vehicleRequest.approvalDate = new Date();
    
    // Update the vehicle status to "In Use"
    const vehicle = await Vehicle.findById(vehicleRequest.vehicleId);
    if (vehicle) {
      vehicle.status = 'In Use';
      vehicle.currentUserId = vehicleRequest.requesterId;
      await vehicle.save();
      
      // Send WebSocket update for vehicle
      sendWebSocketUpdate('vehicleUpdate', vehicle);
    }
    
    await vehicleRequest.save();
    
    // Create a notification for the requester
    await createNotification(
      vehicleRequest.requesterId,
      `Your vehicle request for ${vehicle?.name || 'vehicle'} has been approved`
    );

    // Get the updated request with populated references
    const updatedRequest = await VehicleRequest.findById(req.params.id)
      .populate('vehicleId', 'name licensePlate model type imageUrl')
      .populate('requesterId', 'firstName lastName profilePicture')
      .populate('approvedBy', 'firstName lastName');
    
    // Send WebSocket update with status-change action for clearer client filtering
    sendWebSocketUpdate('requestUpdate', updatedRequest, 'status-change');

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error approving vehicle request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject a vehicle request
exports.rejectVehicleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const vehicleRequest = await VehicleRequest.findById(id);
    if (!vehicleRequest) {
      return res.status(404).json({ message: 'Vehicle request not found' });
    }

    // Create notification for rejection
    if (vehicleRequest.requesterId) {
      await createNotification(
        vehicleRequest.requesterId,
        `Your vehicle request has been rejected: ${reason}`
      );
    }

    // Update the request status
    vehicleRequest.status = 'Rejected';
    vehicleRequest.rejectionReason = reason;
    vehicleRequest.rejectedBy = req.user._id;
    vehicleRequest.rejectionDate = new Date();
    
    await vehicleRequest.save();

    // IMPORTANT: Do NOT create a VehicleUsage entry for rejected requests
    // Rejected requests should stay only in the VehicleRequest table

    // Get the updated request with populated references
    const updatedRequest = await VehicleRequest.findById(req.params.id)
      .populate('vehicleId', 'name licensePlate model type imageUrl')
      .populate('requesterId', 'firstName lastName profilePicture');
    
    // Send WebSocket update with status-change action for clearer client filtering
    sendWebSocketUpdate('requestUpdate', updatedRequest, 'status-change');

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error rejecting vehicle request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Complete a vehicle request (update with end mileage)
exports.completeVehicleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      endMileage, 
      vehicleCondition, 
      notes, 
      vehicleStatus, 
      endDateTime,      // New field for end date and time
      submissionTime    // New field for submission time
    } = req.body;

    if (!endMileage) {
      return res.status(400).json({ message: 'End mileage is required' });
    }

    const vehicleRequest = await VehicleRequest.findById(id);
    if (!vehicleRequest) {
      return res.status(404).json({ message: 'Vehicle request not found' });
    }
    
    // Only the requester or an admin can complete the request
    if (req.user.userType !== 'admin' && 
        vehicleRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this request' });
    }
    
    // Request must be approved to be completed
    if (vehicleRequest.status !== 'Approved') {
      return res.status(400).json({ 
        message: 'Only approved requests can be completed' 
      });
    }
    
    // Ensure end mileage is greater than start mileage
    if (parseFloat(endMileage) <= parseFloat(vehicleRequest.startMileage)) {
      return res.status(400).json({
        message: 'End mileage must be greater than start mileage'
      });
    }
    
    // Calculate the mileage used
    const mileageUsed = parseFloat(endMileage) - parseFloat(vehicleRequest.startMileage);
    
    // Update the vehicle
    const vehicle = await Vehicle.findById(vehicleRequest.vehicleId);
    if (vehicle) {
      // Update vehicle status and condition
      vehicle.currentMileage = parseFloat(endMileage);
      vehicle.condition = vehicleCondition || vehicle.condition;
      vehicle.status = vehicleStatus || 'Available'; // Default to Available if not provided
      vehicle.currentUserId = null; // Clear current user since usage is complete
      vehicle.lastUsed = new Date();
      
      await vehicle.save();
      
      // Send WebSocket update for vehicle
      sendWebSocketUpdate('vehicleUpdate', vehicle);
    }
    
    // Update the request with completion data
    vehicleRequest.status = 'Completed';
    vehicleRequest.endMileage = parseFloat(endMileage);
    // Set endDateTime from the provided value or default to now
    vehicleRequest.endDateTime = endDateTime ? new Date(endDateTime) : new Date();
    // Always set completionDate to the current time (when form was submitted)
    vehicleRequest.completionDate = submissionTime ? new Date(submissionTime) : new Date();
    vehicleRequest.vehicleCondition = vehicleCondition;
    if (notes) vehicleRequest.notes = notes;
    
    await vehicleRequest.save();
    
    // Create a VehicleUsage entry for completed request
    const usage = new VehicleUsage({
      vehicleId: vehicleRequest.vehicleId,
      userId: vehicleRequest.requesterId,
      driverId: vehicleRequest.requesterId, // For compatibility with existing schema
      startMileage: vehicleRequest.startMileage,
      endMileage: parseFloat(endMileage),
      mileageUsed: mileageUsed,
      date: vehicleRequest.date,
      startTime: vehicleRequest.startTime,
      endDateTime: vehicleRequest.endDateTime,    // Add the end date time
      completionDate: vehicleRequest.completionDate, // Add when the form was submitted
      destination: vehicleRequest.destination,
      destinationCoordinates: vehicleRequest.destinationCoordinates,
      reason: vehicleRequest.reason,
      notes: notes || vehicleRequest.notes,
      status: 'Completed',
      condition: vehicleCondition,
      requestId: vehicleRequest._id // Link back to the original request
    });
    
    await usage.save();
    
    // Get the updated request with populated references
    const updatedRequest = await VehicleRequest.findById(id)
      .populate('vehicleId', 'name licensePlate model type imageUrl')
      .populate('requesterId', 'firstName lastName profilePicture');
      
    // Send WebSocket update for the request
    sendWebSocketUpdate('requestUpdate', updatedRequest, 'status-change');
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error completing vehicle request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Process a vehicle request (combined approve/reject endpoint)
exports.processVehicleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    if (status === 'Approved') {
      return exports.approveVehicleRequest(req, res);
    } else if (status === 'Rejected') {
      if (!rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }
      req.body.reason = rejectionReason;
      return exports.rejectVehicleRequest(req, res);
    } else {
      return res.status(400).json({ message: 'Invalid status. Must be "Approved" or "Rejected"' });
    }
  } catch (error) {
    console.error('Error processing vehicle request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all vehicle usages for a specific user
exports.getVehicleUsagesForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all usages by this user
    const usages = await VehicleUsage.find({ userId })
      .populate('vehicleId')
      .sort({ date: -1 });
    
    res.json(usages);
  } catch (error) {
    console.error('Error fetching vehicle usages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
