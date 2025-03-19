const mongoose = require('mongoose');
const emergencyDbConnection = require('../config/emergencyDb');

const userEmergencySchema = new mongoose.Schema({
  emergencyId: {
    type: Number,
    unique: true,
  },
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  profilePicture: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
  },
  age: {
    type: Number,
  },
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
});

// Middleware to generate emergencyId before saving
userEmergencySchema.pre('save', async function(next) {
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

const UserEmergency = emergencyDbConnection.model('user-alerts', userEmergencySchema);

module.exports = UserEmergency;
