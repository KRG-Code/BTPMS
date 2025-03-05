const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getCctvLocations,
  addCctvLocation,
  deleteCctvLocation,
  updateCctvLocation,  // Add this import
} = require("../controllers/cctvLocationController");

const router = express.Router();

// Get all CCTV locations
router.get("/", protect, getCctvLocations);

// Add a new CCTV location
router.post("/", protect, addCctvLocation);

// Delete a CCTV location
router.delete("/:id", protect, deleteCctvLocation);

// Add update route
router.put("/:id", protect, updateCctvLocation);

module.exports = router;
