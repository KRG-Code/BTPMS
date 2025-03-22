const AssistanceRequest = require('../models/AssistanceRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const axios = require('axios');
const { saveBackupRequest } = require('../Emergency_Response/controllers/emergencyController');
const IncidentReport = require('../models/IncidentReport');
const mongoose = require('mongoose');
const { parseAddressString } = require('../utils/addressParser');

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
    const { 
      incidentId, 
      requesterId, 
      location, 
      incidentType, 
      incidentClassification, 
      requesterName 
    } = req.body;
    
    // Validate required fields
    if (!incidentId || !requesterId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Incident ID and requester ID are required' 
      });
    }
    
    // Use a default name if requesterName is not provided
    const finalRequesterName = requesterName || 'Unknown Responder';
    
    // Create new assistance request
    const newAssistanceRequest = new AssistanceRequest({
      incidentId,
      requesterId,
      requesterName: finalRequesterName,
      location: location || 'Unknown location',
      incidentType: incidentType || 'Not specified',
      incidentClassification: incidentClassification || 'Normal Incident',
      dateRequested: new Date(),
      status: 'Pending'
    });
    
    await newAssistanceRequest.save();
    
    // Create notification for admins
    try {
      const admins = await User.find({ userType: 'admin' });
      
      // Create notifications for all admins
      if (admins.length > 0) {
        const notifications = admins.map(admin => ({
          userId: admin._id,
          message: `New assistance request from ${finalRequesterName} for incident: ${incidentType}`,
          type: 'ASSISTANCE_REQUEST'
        }));
        
        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      console.error('Error creating admin notifications:', notificationError);
      // Continue even if notification creation fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Assistance request created successfully',
      request: newAssistanceRequest
    });
    
  } catch (error) {
    console.error('Error creating assistance request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating assistance request',
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

exports.updateAssistanceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, approverName, department } = req.body;

    // Find the assistance request
    const assistanceRequest = await AssistanceRequest.findById(id)
      .populate('incidentId');
    
    if (!assistanceRequest) {
      return res.status(404).json({ message: 'Assistance request not found' });
    }

    // If request is being approved, prepare data for emergency database
    if (status === 'Processing' || status === 'Approved') {
      // Get incident details
      const incidentReport = assistanceRequest.incidentId;
      
      // Use the address field from the incident report instead of reverse geocoding
      const address = incidentReport.address || '';
      
      // Parse the address string into components
      const parsedAddress = parseAddressString(address);
      
      // Prepare data for emergency database
      const emergencyData = {
        incidentId: incidentReport._id.toString(),
        ticketId: incidentReport.ticketId || `ER-${Date.now()}`,
        incidentType: incidentReport.type,
        incidentClassification: incidentReport.incidentClassification,
        description: incidentReport.description,
        // Location data
        coordinates: {
          latitude: incidentReport.location.match(/Lat:\s*([0-9.-]+)/)?.[1] || null,
          longitude: incidentReport.location.match(/Lon:\s*([0-9.-]+)/)?.[1] || null
        },
        // Address components from the parsed address
        address: {
          street: parsedAddress.street,
          barangay: parsedAddress.barangay,
          city: parsedAddress.city, 
          province: parsedAddress.province
        },
        // Reporter info
        reporterName: incidentReport.fullName,
        reporterContact: incidentReport.contactNumber,
        // Processing info
        approverName: approverName,
        approvingDepartment: department || 'BTPMS',
        approvalDateTime: new Date(),
        // Status tracking
        status: 'Pending',
        updatedAt: new Date()
      };

      // Send to emergency database
      try {
        // Connect to emergencyDb and save data
        const emergencyDb = mongoose.connection.useDb('emergencyDb');
        const EmergencyRequest = emergencyDb.model('EmergencyRequest');
        
        await new EmergencyRequest(emergencyData).save();
        
        console.log('Assistance request forwarded to emergency database');
      } catch (emergencyDbError) {
        console.error('Error saving to emergency database:', emergencyDbError);
        // Continue with the request even if emergency DB fails
      }
    }

    // Update the assistance request status and save
    // ...existing code for updating the request...

    return res.status(200).json({ message: 'Assistance request updated', assistanceRequest });
  } catch (error) {
    console.error('Error updating assistance request status:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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
          assistanceRequestId: updatedRequest._id,
          // Include the address field from the incident
          address: fullIncident.incidentId.address || ''
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
