// schedule.js (Model)
const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  unit: {
    type: String,
    required: true,
    enum: ["Unit 1", "Unit 2", "Unit 3"], // Only allow these 3 units
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
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Schedule", scheduleSchema);
