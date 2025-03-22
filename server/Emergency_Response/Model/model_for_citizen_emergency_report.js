const mongoose = require('mongoose');
const emergencyDbConnection = require('../config/emergencyDb');

const citizenEmergencySchema = new mongoose.Schema({
  profilePicture: {
    type: String,
    default: 'N/A'
  },
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    default: 'N/A'
  },
  // Flatten address fields instead of nested object
  street: {
    type: String,
    default: 'N/A'
  },
  barangay: {
    type: String,
    default: 'N/A'
  },
  city: {
    type: String,
    default: 'N/A'
  },
  province: {
    type: String,
    default: 'N/A'
  },
  // Direct coordinate fields instead of array
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  phone: {
    type: String,
  },
  emergencyType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'new'
  },
  responderProfile: {
    type: String,
    default: 'N/A'
  },
  responderId: {
    type: String,
    default: 'N/A'
  },
  responderName: {
    type: String,
    default: 'N/A'
  },
  responderAddress: {
    state: { type: String, default: 'N/A' },
    town: { type: String, default: 'N/A' },
    suburb: { type: String, default: 'N/A' }
  },
  responderLocation: {
    type: [Number],
    default: undefined
  },
  responseAt: {
    type: Date
  },
  rescueAt: {
    type: Date
  },
  safeAt: {
    type: Date
  },
  viewedByAdminName: {
    type: String,
    default: 'N/A'
  },
  viewedByAdminProfile: {
    type: String,
    default: 'N/A'
  },
  viewedByAdminId: {
    type: String,
    default: 'N/A'
  },
  backup: {
    type: Boolean,
    default: false
  },
  assistanceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  emergencyId: {
    type: Number
  }
});

// Middleware to generate emergencyId before saving
citizenEmergencySchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const maxDoc = await this.constructor.findOne({}, {}, { sort: { emergencyId: -1 } });
    this.emergencyId = maxDoc ? maxDoc.emergencyId + 1 : 10000;
    next();
  } catch (error) {
    next(error);
  }
});

const CitizenEmergency = emergencyDbConnection.model('user-emergency', citizenEmergencySchema);

module.exports = CitizenEmergency;
