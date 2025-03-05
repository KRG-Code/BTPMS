const IncidentReport = require('../models/IncidentReport');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create a new incident report
exports.createIncidentReport = async (req, res) => {
  try {
    const { incidentClassification, type, location, locationNote, description, date, time, fullName, contactNumber } = req.body;

    console.log("Incoming request data:", req.body); // Log the incoming request data

    const newIncidentReport = new IncidentReport({
      incidentClassification,
      type,
      location,
      locationNote,
      description,
      date,
      time,
      fullName,
      contactNumber,
      status: 'Pending' // This is optional since we set the default in the schema
    });

    await newIncidentReport.save();

    // Fetch all Tanod and Admin users
    const tanodsAndAdmins = await User.find({ userType: { $in: ['tanod', 'admin'] } });

    // Create notifications for each Tanod and Admin
    const notifications = tanodsAndAdmins.map(user => ({
      userId: user._id,
      message: `New incident reported: ${type} at ${location}.`,
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
      const notifications = admins.map(admin => ({
        userId: admin._id,
        message: `Incident #${id} has been resolved.`,
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
