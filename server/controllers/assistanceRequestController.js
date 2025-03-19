const AssistanceRequest = require('../models/AssistanceRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { saveBackupRequest } = require('../Emergency_Response/controllers/emergencyController');

exports.createAssistanceRequest = async (req, res) => {
  try {
    const {
      incidentId,
      requesterId,
      location,
      incidentType,
      incidentClassification,
      dateRequested,
      requesterName
    } = req.body;

    const newRequest = new AssistanceRequest({
      incidentId,
      requesterId,
      location,
      incidentType,
      incidentClassification,
      dateRequested,
      requesterName,
      status: 'Pending'
    });

    await newRequest.save();

    // Notify admins about the assistance request
    const admins = await User.find({ userType: 'admin' });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      message: `New assistance request from ${requesterName} for incident at ${location}`,
      type: 'ASSISTANCE_REQUEST'
    }));

    await Notification.insertMany(notifications);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating assistance request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
