const AssistanceRequest = require('../models/AssistanceRequest');
const Notification = require('../models/Notification');

class AssistanceIntegrationService {
  async updateAssistance(incidentId, updateData) {
    try {
      // First, find the assistance request
      let assistanceRequest = await AssistanceRequest.findOne({ 
        'incidentId': incidentId 
      });

      if (!assistanceRequest) {
        throw new Error('Assistance request not found for this incident');
      }

      // Update the assistance request
      const updatedAssistance = await AssistanceRequest.findByIdAndUpdate(
        assistanceRequest._id,
        {
          status: updateData.status,
          notes: updateData.notes,
          approvedBy: updateData.adminId,
          approvedAt: new Date()
        },
        { new: true }
      ).populate('incidentId requesterId approvedBy');

      return updatedAssistance;
    } catch (error) {
      throw new Error(`Assistance update failed: ${error.message}`);
    }
  }

  async getAssistanceByIncidentId(incidentId) {
    try {
      return await AssistanceRequest.findOne({ incidentId })
        .populate('incidentId')
        .populate('requesterId')
        .populate('approvedBy');
    } catch (error) {
      throw new Error(`Failed to get assistance: ${error.message}`);
    }
  }

  async getAllAssistance(filters = {}) {
    try {
      return await AssistanceRequest.find(filters)
        .populate('incidentId')
        .populate('requesterId')
        .populate('approvedBy')
        .sort({ dateRequested: -1 });
    } catch (error) {
      throw new Error(`Failed to get assistance list: ${error.message}`);
    }
  }
}

module.exports = new AssistanceIntegrationService();
