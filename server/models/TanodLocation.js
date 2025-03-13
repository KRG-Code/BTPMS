const mongoose = require('mongoose');

const tanodLocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  currentScheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  markerColor: {
    type: String,
    default: 'red'
  },
  isOnPatrol: {
    type: Boolean,
    default: false
  }
});

// Add index for better query performance
tanodLocationSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('TanodLocation', tanodLocationSchema);
