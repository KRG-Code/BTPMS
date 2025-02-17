const mongoose = require("mongoose");

const polygonSchema = new mongoose.Schema({
  legend: {
    type: String,
    required: [true, "Legend is required"],
    trim: true,
  },
  color: {
    type: String,
    required: [true, "Color is required"],
  },
  coordinates: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Polygon", polygonSchema);
