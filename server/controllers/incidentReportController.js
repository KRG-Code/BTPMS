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
