const IncidentReport = require('../models/IncidentReport');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create incident report from external system
exports.createIncidentReport = async (req, res) => {
  try {
    const { 
      type, 
      location, 
      locationNote, 
      address, 
      description, 
      date, 
      time, 
      fullName, 
      contactNumber, 
      email,
      incidentClassification
    } = req.body;

    // Validate required fields
    if (!type || !location) {
      return res.status(400).json({ 
        success: false,
        message: "Type and location are required fields" 
      });
    }

    // Generate a ticket ID for tracking
    const ticketId = `IR-EXT-${Date.now().toString().substring(6)}`;

    // Create new incident report
    const newIncidentReport = new IncidentReport({
      type,
      location,
      locationNote,
      address,
      description: description || "No description provided",
      date: date || new Date(),
      time,
      fullName: fullName || "External System",
      contactNumber: contactNumber || "",
      email: email || "",
      status: "Pending",
      incidentClassification: incidentClassification === "Emergency Incident" 
        ? "Emergency Incident" 
        : "Normal Incident",
      ticketId,
      source: 'integration_api' // Mark incidents created through the API
    });

    await newIncidentReport.save();
    
    // Get human-readable location
    let locationDisplay = address || location;
    
    // Notify system admins and tanods about the new incident
    const tanodsAndAdmins = await User.find({ userType: { $in: ['tanod', 'admin'] } });
    
    const notifications = tanodsAndAdmins.map(user => ({
      userId: user._id,
      message: `New incident reported via external system: ${type} at ${locationDisplay}.`,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ 
      success: true,
      message: 'Incident report created successfully',
      data: {
        id: newIncidentReport._id,
        ticketId,
        status: newIncidentReport.status,
        createdAt: newIncidentReport.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating incident report via integration API:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message
    });
  }
};

// Get all incident reports with filtering options
exports.getIncidentReports = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { 
      status, 
      type, 
      startDate, 
      endDate, 
      classification,
      limit = 100,
      page = 1
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (classification) filter.incidentClassification = classification;
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // End of day
        filter.date.$lte = endDateObj;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination and sorting
    const incidents = await IncidentReport.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await IncidentReport.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: incidents.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: incidents
    });
  } catch (error) {
    console.error('Error fetching incident reports via integration API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get incident report by ID
exports.getIncidentReportById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const incident = await IncidentReport.findById(id)
      .populate('responder', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName');
    
    if (!incident) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incident report not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error fetching incident report by ID via integration API:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get incident report by ticket ID
exports.getIncidentReportByTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const incident = await IncidentReport.findOne({ ticketId })
      .populate('responder', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName');
    
    if (!incident) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incident report not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error fetching incident report by ticket ID via integration API:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update incident report
exports.updateIncidentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Add integration source tracking
    updateData.updatedAt = new Date();
    updateData.updatedVia = 'integration_api';
    
    // Special handling for status updates
    if (updateData.status) {
      // Don't allow external system to mark as "Resolved" through this endpoint
      // Internal operations should use the main controller
      if (updateData.status === 'Resolved') {
        return res.status(403).json({
          success: false,
          message: 'External systems cannot mark incidents as resolved. Please use the main system.'
        });
      }
    }
    
    const incident = await IncidentReport.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!incident) {
      return res.status(404).json({ 
        success: false,
        message: 'Incident report not found' 
      });
    }
    
    // Notify admins about important updates
    if (updateData.status || updateData.incidentClassification) {
      const admins = await User.find({ userType: 'admin' });
      
      const updateType = updateData.status 
        ? `status changed to ${updateData.status}` 
        : `classification changed to ${updateData.incidentClassification}`;
      
      const notifications = admins.map(admin => ({
        userId: admin._id,
        message: `Incident #${incident.ticketId} ${updateType} via external system.`,
      }));
      
      await Notification.insertMany(notifications);
    }
    
    res.status(200).json({
      success: true,
      message: 'Incident report updated successfully',
      data: incident
    });
  } catch (error) {
    console.error('Error updating incident report via integration API:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};
