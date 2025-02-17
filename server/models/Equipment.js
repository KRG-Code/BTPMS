// equipment.js
const mongoose = require("mongoose");

// Define the equipment schema
const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  borrowDate: {
    type: Date, // Changed to Date for proper date handling
    required: true,
  },
  returnDate: {
    type: Date, // Changed to Date for proper date handling
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
}, { timestamps: true }); // Optionally add timestamps for createdAt and updatedAt

// Export the Equipment model
module.exports = mongoose.model("Equipment", equipmentSchema);
