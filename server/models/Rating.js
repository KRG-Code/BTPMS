// models/TanodRating.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    default: 'Anonymous'
  },
  identifier: {
    type: String
  },
  visitorIdentifier: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const tanodRatingSchema = new mongoose.Schema({
  tanodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: [ratingSchema]
});

module.exports = mongoose.model('TanodRating', tanodRatingSchema);
