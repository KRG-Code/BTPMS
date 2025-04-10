const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  vehicleId: {
    type: String,
    unique: true,
    default: function() {
      return 'VH-' + Math.random().toString(36).substring(2, 6).toUpperCase() + 
             Date.now().toString().substring(9, 13);
    },
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  currentMileage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Available', 'In Use', 'Maintenance', 'Out of Service'],
    default: 'Available'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Make the vehicleId index sparse so it ignores null values
vehicleSchema.index({ vehicleId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
