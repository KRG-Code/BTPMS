const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  locationNote: {
    type: String
  },
  address: {
    type: String
  },
  description: {
    type: String,
    default: "Not provided"
  },
  date: {
    type: Date,
    default: Date.now
  },
  time: {
    type: String
  },
  fullName: {
    type: String
  },
  contactNumber: {
    type: String
  },
  email: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  ticketId: {
    type: String,
    unique: true
  },
  incidentClassification: {
    type: String,
    enum: ['Normal Incident', 'Emergency Incident'],
    default: 'Normal Incident'
  },
  responder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responderName: {
    type: String
  },
  respondedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedByFullName: {
    type: String
  },
  resolvedAt: {
    type: Date
  },
  log: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure location field is indexed
incidentReportSchema.index({ location: '2dsphere' });

// Automatically update the updatedAt time
incidentReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
