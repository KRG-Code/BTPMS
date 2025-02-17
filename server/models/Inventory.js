// models/Inventory.js
const mongoose = require("mongoose");
const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item name is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be negative"],
  },
  total: {
    type: Number,
    required: true,
    min: [0, "Total cannot be negative"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Inventory", inventorySchema);
