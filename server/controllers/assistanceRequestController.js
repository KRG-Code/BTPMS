const AssistanceRequest = require('../models/AssistanceRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const axios = require('axios');
const { saveBackupRequest } = require('../Emergency_Response/controllers/emergencyController');

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

// Create a new assistance request
exports.createAssistanceRequest = async (req, res) => {
  try {
    const { userId, location, description, emergency, imageUrls } = req.body;
    
    // Create the assistance request
    const newRequest = new AssistanceRequest({
      userId,
      location,
      description,
      emergency,
      status: 'Pending',
      imageUrls
    });
    
    await newRequest.save();
    
    // Get user details for notification
    const user = await User.findById(userId).select('firstName lastName');
    
    // Get human-readable address from coordinates
    const address = await getAddressFromCoordinates(location.latitude, location.longitude);
    
    // Notify all tanods and admins
    const tanodsAndAdmins = await User.find({ userType: { $in: ['tanod', 'admin'] }});
    
    const notifications = tanodsAndAdmins.map(recipient => ({
      userId: recipient._id,
      message: `New assistance request from ${user.firstName} ${user.lastName} for incident at ${address}`
    }));
    
    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: 'Assistance request created successfully',
      request: newRequest
    });
  } catch (error) {
    console.error('Error creating assistance request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getAssistanceStatus = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const request = await AssistanceRequest.findOne({ incidentId })
      .populate('incidentId', '_id type location description')
      .sort({ dateRequested: -1 });
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateAssistanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, approverName, reason } = req.body;

    const updateData = {
      status,
      $push: status === 'Rejected' ? {
        rejectedDetails: {
          department: 'BTPMS',
          rejectorName: approverName,
          rejectedDateTime: new Date(),
          reason: reason,
          notes: notes
        }
      } : {
        approvedDetails: {
          department: 'BTPMS',
          approverName: approverName,
          approvedDateTime: new Date(),
          notes: notes
        }
      }
    };

    const updatedRequest = await AssistanceRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('requesterId incidentId');

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Assistance request not found' });
    }

    // If request is approved (Processing), save to emergency database
    if (status === 'Processing') {
      try {
        const fullIncident = await updatedRequest.populate('incidentId');
        const requester = await User.findById(updatedRequest.requesterId).select('firstName lastName contactNumber');
        
        if (!fullIncident.incidentId || !fullIncident.incidentId.location) {
          throw new Error('Missing incident location data');
        }

        await saveBackupRequest({
          incidentType: updatedRequest.incidentType || fullIncident.incidentId.type,
          location: fullIncident.incidentId.location,
          rawLocation: updatedRequest.location,
          description: fullIncident.incidentId.description,
          tanodName: requester ? `${requester.firstName} ${requester.lastName}` : 'Unknown',
          tanodContact: requester?.contactNumber || 'N/A',
          assistanceRequestId: updatedRequest._id // Add this field
        });
      } catch (error) {
        console.error('Error saving to emergency database:', error);
        // Don't throw, but log the error and continue
      }
    }

    // Notify the requester about the status update
    await Notification.create({
      userId: updatedRequest.requesterId._id,
      message: `Your assistance request has been ${status.toLowerCase()}`,
      type: 'ASSISTANCE_UPDATE'
    });

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllAssistanceRequests = async (req, res) => {
  try {
    const requests = await AssistanceRequest.find()
      .populate({
        path: 'incidentId',
        select: '_id type location description'
      })
      .populate('requesterId', 'firstName lastName')
      .sort({ dateRequested: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching assistance requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAssistanceRequestsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await AssistanceRequest.find({ requesterId: userId })
      .populate('incidentId', 'type location description')
      .sort({ dateRequested: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching user assistance requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
