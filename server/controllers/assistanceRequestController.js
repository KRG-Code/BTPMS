const AssistanceRequest = require('../models/AssistanceRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

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
    ).populate('requesterId');

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Assistance request not found' });
    }

    // Notify the requester about the status update
    await Notification.create({
      userId: updatedRequest.requesterId._id,
      message: `Your assistance request has been ${status.toLowerCase()}`,
      type: 'ASSISTANCE_UPDATE'
    });

    res.status(200).json(updatedRequest);
  } catch (error) {
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
