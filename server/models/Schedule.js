// schedule.js (Model)
const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  unit: {
    type: String,
    required: true,
    enum: ["Unit 1", "Unit 2", "Unit 3", "Day Shift", "Night Shift"], // Updated to include shift types
  },
  scheduleID: {
    type: String,
    default: function() {
      const timestamp = new Date().getTime().toString().slice(-6);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `SCH-${timestamp}-${random}`;
    }
  },
  tanods: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Referencing the User (Tanod)
      required: true,
    },
  ],
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  patrolArea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Polygon', // Referencing the Polygon (Patrol Area)
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed'],
    default: 'Upcoming',
  },
  patrolStatus: [
    {
      tanodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      status: {
        type: String,
        enum: ['Not Started', 'Started', 'Completed', 'Absent'],
        default: 'Not Started',
      },
      startTime: {
        type: Date,
        default: null,
      },
      endTime: {
        type: Date,
        default: null,
      },
    },
  ],
  patrolLogs: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      log: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule',
      },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Schedule", scheduleSchema);
