const mongoose = require("mongoose");

const cctvLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
  },
  latitude: {
    type: Number,
    required: [true, "Latitude is required"],
  },
  longitude: {
    type: Number,
    required: [true, "Longitude is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("CctvLocation", cctvLocationSchema);
