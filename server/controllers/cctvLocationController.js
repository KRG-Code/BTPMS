const CctvLocation = require("../models/CctvLocation");

// Get all CCTV locations
exports.getCctvLocations = async (req, res) => {
  try {
    const locations = await CctvLocation.find();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve CCTV locations", error: error.message });
  }
};

// Add a new CCTV location
exports.addCctvLocation = async (req, res) => {
  const { name, description, latitude, longitude } = req.body;

  if (!name || !description || !latitude || !longitude) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newLocation = new CctvLocation({
      name,
      description,
      latitude,
      longitude
    });

    await newLocation.save();
    res.status(201).json({ message: "CCTV location added successfully", location: newLocation });
  } catch (error) {
    res.status(500).json({ message: "Failed to add CCTV location", error: error.message });
  }
};

// Delete a CCTV location
exports.deleteCctvLocation = async (req, res) => {
  const { id } = req.params;

  try {
    const location = await CctvLocation.findByIdAndDelete(id);
    if (!location) {
      return res.status(404).json({ message: "CCTV location not found" });
    }
    res.status(200).json({ message: "CCTV location deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete CCTV location", error: error.message });
  }
};

// Add update CCTV location endpoint
exports.updateCctvLocation = async (req, res) => {
  const { id } = req.params;
  const { name, description, latitude, longitude } = req.body;

  try {
    const location = await CctvLocation.findById(id);
    if (!location) {
      return res.status(404).json({ message: "CCTV location not found" });
    }

    location.name = name || location.name;
    location.description = description || location.description;
    location.latitude = latitude || location.latitude;
    location.longitude = longitude || location.longitude;

    await location.save();
    res.status(200).json({ message: "CCTV location updated successfully", location });
  } catch (error) {
    res.status(500).json({ message: "Failed to update CCTV location", error: error.message });
  }
};
