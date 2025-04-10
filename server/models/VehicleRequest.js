const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vehicleRequestSchema = new Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester ID is required']
  },
  startMileage: {
    type: Number,
    required: [true, 'Start mileage is required']
  },
  endMileage: {
    type: Number,
    default: null
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  completionDate: {
    type: Date,
    default: null
  },
  destination: {
    type: String,
    required: [true, 'Destination is required']
  },
  destinationCoordinates: {
    latitude: Number,
    longitude: Number
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    enum: ['Patrol', 'Emergency Response', 'Transport', 'Maintenance', 'Official Business', 'Other']
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending'
  },
  approvalDate: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  vehicleCondition: {
    type: String,
    enum: ['Good condition', 'Needs minor maintenance', 'Needs major maintenance', 'Not operational'],
    default: 'Good condition'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: false
  },
  endDateTime: {  // New field for the end date and time when trip completed
    type: Date
  },
  rejectionDate: {
    type: Date
  }
}, { timestamps: true });

// Pre-save hook to convert string objectIds to ObjectId instances if needed
vehicleRequestSchema.pre('save', function(next) {
  try {
    // Ensure vehicleId is a valid ObjectId
    if (this.vehicleId && typeof this.vehicleId === 'string') {
      this.vehicleId = mongoose.Types.ObjectId(this.vehicleId);
    }
    
    // Ensure requesterId is a valid ObjectId
    if (this.requesterId && typeof this.requesterId === 'string') {
      this.requesterId = mongoose.Types.ObjectId(this.requesterId);
    }
    
    // Ensure approvedBy is a valid ObjectId if present
    if (this.approvedBy && typeof this.approvedBy === 'string') {
      this.approvedBy = mongoose.Types.ObjectId(this.approvedBy);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('VehicleRequest', vehicleRequestSchema);
