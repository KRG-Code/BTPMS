const mongoose = require('mongoose');

const assistanceRequestSchema = new mongoose.Schema({
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncidentReport',
    required: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  incidentType: {
    type: String,
    required: true
  },
  incidentClassification: {
    type: String,
    required: true
  },
  dateRequested: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  notes: {
    type: String
  }
});

module.exports = mongoose.model('AssistanceRequest', assistanceRequestSchema);
