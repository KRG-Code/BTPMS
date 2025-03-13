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
    enum: ['Pending', 'Processing', 'Rejected', 'Completed'],
    default: 'Pending'
  },
  approvedDetails: [{
    department: {
      type: String,
      default: 'BTPMS'
    },
    approverName: {
      type: String,
      required: true
    },
    approvedDateTime: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String
    }
  }],
  rejectedDetails: [{
    department: {
      type: String,
      default: 'BTPMS'
    },
    rejectorName: {
      type: String,
      required: true
    },
    rejectedDateTime: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true
    },
    notes: {
      type: String
    }
  }]
});

module.exports = mongoose.model('AssistanceRequest', assistanceRequestSchema);
