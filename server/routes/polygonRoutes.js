const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getPolygons,
  addPolygon,
  updatePolygon,
  deletePolygon,
  getPolygonById,
  getPolygonsByPatrolAreaId, // Import the controller function
} = require("../controllers/polygonController");

const router = express.Router();

// Fetch all polygons
router.get("/", protect, getPolygons);

// Fetch a single polygon by ID
router.get("/:id", protect, getPolygonById);

// Fetch polygons by patrol area ID
router.get("/patrolArea/:patrolAreaId", protect, getPolygonsByPatrolAreaId); // Add this route

// Add a new polygon
router.post("/", protect, addPolygon);

// Update an existing polygon
router.put("/:id", protect, updatePolygon);

// Delete a polygon
router.delete("/:id", protect, deletePolygon);

module.exports = router;
