const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  incidentClassification: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  locationNote: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  log: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedByFullName: {
    type: String,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  responder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  responderName: {
    type: String,
    default: null
  },
  respondedAt: {
    type: Date,
    default: null
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
