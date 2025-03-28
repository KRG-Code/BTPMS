const mongoose = require('mongoose');

const falseAlarmSchema = new mongoose.Schema({
  // Include all the fields from the incident report
  originalIncidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncidentReport'
  },
  incidentClassification: {
    type: String,
    enum: ['Normal Incident', 'Emergency Incident'],
    default: 'Normal Incident',
  },
  type: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: null
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
    default: 'False Alarm'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  ticketId: {
    type: String,
  },
  otherType: {
    type: String
  },
  markedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  markedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FalseAlarm', falseAlarmSchema);
