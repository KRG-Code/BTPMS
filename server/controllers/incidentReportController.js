const IncidentReport = require('../models/IncidentReport');
const Notification = require('../models/Notification');
const User = require('../models/User');
const axios = require('axios');

// Helper function for reverse geocoding
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap's Nominatim API for reverse geocoding
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        format: 'json',
        lat: latitude,
        lon: longitude,
        zoom: 18,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'BTPMS Application' // Required by Nominatim's terms of use
      }
    });

    if (response.data && response.data.display_name) {
      // Extract and format a simplified address
      const address = response.data.display_name;
      // Simplify the address if it's too long
      return address.length > 50 ? address.substring(0, 47) + '...' : address;
    }
    return `Lat: ${latitude}, Lon: ${longitude}`;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return `Lat: ${latitude}, Lon: ${longitude}`;
  }
};

// Create a new incident report
exports.createIncidentReport = async (req, res) => {
  try {
    const { incidentClassification, type, location, locationNote, address, description, date, time, fullName, contactNumber, ticketId } = req.body;

    console.log("Incoming request data:", req.body); // Log the incoming request data

    const newIncidentReport = new IncidentReport({
      incidentClassification,
      type,
      location,
      locationNote,
      address, // Add the address field here
      description,
      date,
      time,
      fullName,
      contactNumber,
      status: 'Pending', // This is optional since we set the default in the schema
      ticketId // Include ticketId in the new report
    });

    await newIncidentReport.save();

    // Get human-readable address from coordinates if available
    let locationDisplay = address || location; // Use the provided address when available
    if (location && location.latitude && location.longitude) {
      locationDisplay = await getAddressFromCoordinates(location.latitude, location.longitude);
    }

    // Fetch all Tanod and Admin users
    const tanodsAndAdmins = await User.find({ userType: { $in: ['tanod', 'admin'] } });

    // Create notifications for each Tanod and Admin
    const notifications = tanodsAndAdmins.map(user => ({
      userId: user._id,
      message: `New incident reported: ${type} at ${locationDisplay}.`,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ message: 'Incident report created successfully', incidentReport: newIncidentReport });
  } catch (error) {
    console.error('Error creating incident report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all incident reports
exports.getIncidentReports = async (req, res) => {
  try {
    const incidentReports = await IncidentReport.find();
    res.status(200).json(incidentReports);
  } catch (error) {
    console.error('Error fetching incident reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update incident status
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, log, userId } = req.body;

    // First get the user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let updateData = { status };

    // If status is 'In Progress', add responder details
    if (status === 'In Progress') {
      updateData = {
        ...updateData,
        responder: userId,
        responderName: `${user.firstName} ${user.lastName}`,
        respondedAt: new Date()
      };
    }
    
    // If status is 'Resolved', include resolution details
    if (status === 'Resolved') {
      updateData = {
        ...updateData,
        log,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolvedByFullName: `${user.firstName} ${user.lastName}`
      };
    }

    const updatedIncident = await IncidentReport.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('responder', 'firstName lastName');

    if (!updatedIncident) {
      return res.status(404).json({ message: 'Incident report not found' });
    }

    // Create notification for the resolution if status is 'Resolved'
    if (status === 'Resolved') {
      // Notify admins about the resolution
      const admins = await User.find({ userType: 'admin' });
      
      // Format incident ID in a more readable way
      const incidentNumber = id.substring(id.length - 6).toUpperCase();
      
      const notifications = admins.map(admin => ({
        userId: admin._id,
        message: `Incident #${incidentNumber} has been resolved by ${user.firstName} ${user.lastName}.`,
      }));

      await Notification.insertMany(notifications);
    }

    res.status(200).json(updatedIncident);
  } catch (error) {
    console.error('Error updating incident status:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

// Add new method to get incident details with resolution info
exports.getIncidentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await IncidentReport.findById(id)
      .populate('resolvedBy', 'firstName lastName');
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident report not found' });
    }

    res.status(200).json(incident);
  } catch (error) {
    console.error('Error fetching incident details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
