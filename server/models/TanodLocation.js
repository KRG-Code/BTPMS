const mongoose = require('mongoose');

const TanodLocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latitude: {
    type: Number,
    required: true,
    default: 0
  },
  longitude: {
    type: Number,
    required: true,
    default: 0
  },
  currentScheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    default: null
  },
  markerColor: {
    type: String,
    default: 'red'
  },
  isOnPatrol: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index for fast lookups
TanodLocationSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('TanodLocation', TanodLocationSchema);
