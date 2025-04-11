const mongoose = require('mongoose');

const AuditReportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    enum: ['equipment', 'vehicle', 'combined']
  },
  period: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'quarterly', 'annual', 'custom']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportData: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditReport', AuditReportSchema);
