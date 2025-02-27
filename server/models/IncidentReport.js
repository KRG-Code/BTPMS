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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
