const assistanceIntegrationService = require('../services/assistanceIntegrationService');

exports.handleAssistanceOperation = async (req, res) => {
  try {
    // Add validation for required fields
    const { incidentId, status, adminId, notes } = req.body;
    if (!incidentId) {
      return res.status(400).json({
        success: false,
        message: 'Incident ID is required'
      });
    }

    const result = await assistanceIntegrationService.createOrUpdateAssistance(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Assistance request created/updated successfully'
    });
  } catch (error) {
    console.error('Assistance operation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing assistance request'
    });
  }
};

exports.handleAssistanceDelete = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const result = await assistanceIntegrationService.deleteAssistance(incidentId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateAssistanceStatus = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { status, adminId, notes } = req.body;

    if (!status || !adminId) {
      return res.status(400).json({
        success: false,
        message: 'Status and adminId are required'
      });
    }

    const result = await assistanceIntegrationService.updateAssistance(incidentId, {
      status,
      adminId,
      notes,
      approvedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: result,
      message: `Assistance request ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Update assistance error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllAssistance = async (req, res) => {
  try {
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const result = await assistanceIntegrationService.getAllAssistance(filters);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAssistanceByIncidentId = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const result = await assistanceIntegrationService.getAssistanceByIncidentId(incidentId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Assistance request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
