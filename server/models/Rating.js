// models/TanodRating.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  tanodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensure one document per tanod
  },
  ratings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // New fields for anonymous ratings
    fullName: {
      type: String,
      default: "Anonymous"
    },
    identifier: {
      type: String // To track anonymous users across sessions
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('TanodRating', ratingSchema);
