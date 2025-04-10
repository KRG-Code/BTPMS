const mongoose = require("mongoose");

const vehicleUsageSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: { // For compatibility with existing code
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startMileage: {
    type: Number
  },
  endMileage: {
    type: Number
  },
  mileageUsed: {
    type: Number
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {  // New field for start time
    type: Date
  },
  endDateTime: {  // New field for the end date and time when trip completed
    type: Date
  },
  completionDate: { // When the form was submitted
    type: Date
  },
  destination: {
    type: String,
    required: true
  },
  destinationCoordinates: {
    latitude: Number,
    longitude: Number
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['Completed', 'Rejected'],
    default: 'Completed'
  },
  condition: {
    type: String,
    enum: ['Good condition', 'Needs minor maintenance', 'Needs major maintenance', 'Not operational']
  },
  requestId: { // Link to the original request
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleRequest'
  }
}, { timestamps: true });

module.exports = mongoose.model("VehicleUsage", vehicleUsageSchema);
