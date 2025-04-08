const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Theft', 'Assault', 'Harassment', 'Vandalism', 'Noise Complaint', 'Suspicious Activity', 'Traffic Violation', 'Other']
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Pending'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  responder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responseDetails: {
    type: String
  },
  respondedAt: {
    type: Date
  },
  images: [String],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure location field is indexed
incidentReportSchema.index({ location: '2dsphere' });

// Automatically update the updatedAt time
incidentReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
