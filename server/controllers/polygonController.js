const Polygon = require("../models/Polygon");

// Fetch all polygons
exports.getPolygons = async (req, res) => {
  try {
    const polygons = await Polygon.find();
    res.status(200).json(polygons);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve polygons", error: error.message });
  }
};

// Fetch a single polygon by ID
exports.getPolygonById = async (req, res) => {
  const { id } = req.params;
  try {
    const polygon = await Polygon.findById(id);
    if (!polygon) {
      return res.status(404).json({ message: "Polygon not found" });
    }
    res.status(200).json(polygon);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve polygon", error: error.message });
  }
};

// Add a new polygon
exports.addPolygon = async (req, res) => {
  const { legend, color, coordinates } = req.body;

  if (!legend || !color || !coordinates) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newPolygon = new Polygon({ legend, color, coordinates });
    await newPolygon.save();
    res.status(201).json({ message: "Polygon created successfully", polygon: newPolygon });
  } catch (error) {
    res.status(500).json({ message: "Failed to add polygon", error: error.message });
  }
};

// Update a polygon
exports.updatePolygon = async (req, res) => {
  const { id } = req.params;
  const { legend, color, coordinates } = req.body;

  try {
    const polygon = await Polygon.findById(id);
    if (!polygon) {
      return res.status(404).json({ message: "Polygon not found" });
    }

    polygon.legend = legend || polygon.legend;
    polygon.color = color || polygon.color;
    polygon.coordinates = coordinates || polygon.coordinates;

    await polygon.save();
    res.status(200).json({ message: "Polygon updated successfully", polygon });
  } catch (error) {
    res.status(500).json({ message: "Failed to update polygon", error: error.message });
  }
};

// Delete a polygon
exports.deletePolygon = async (req, res) => {
  const { id } = req.params;

  try {
    const polygon = await Polygon.findByIdAndDelete(id);
    if (!polygon) {
      return res.status(404).json({ message: "Polygon not found" });
    }

    res.status(200).json({ message: "Polygon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete polygon", error: error.message });
  }
};

// Fetch polygons by patrol area ID
exports.getPolygonsByPatrolAreaId = async (req, res) => {
  const { patrolAreaId } = req.params;
  try {
    const polygons = await Polygon.find({ patrolArea: patrolAreaId });
    res.status(200).json(polygons);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve polygons", error: error.message });
  }
};
