const Inventory = require("../models/Inventory");

// Fetch all inventory items
exports.getInventory = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find();
    res.status(200).json(inventoryItems);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve inventory items." });
  }
};

// controllers/inventoryController.js

// Add a new inventory item
exports.addInventoryItem = async (req, res) => {
  const { name, quantity } = req.body;

  if (!name || quantity == null) {
    return res.status(400).json({ message: "Name and quantity are required." });
  }

  try {
    const newItem = new Inventory({ name, quantity, total: quantity });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to add inventory item." });
  }
};

// Update an inventory item
exports.updateInventoryItem = async (req, res) => {
  const { quantity } = req.body;

  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        total: req.body.total || (quantity + (item.total - item.quantity)),
      },
      { new: true }
    );

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to update item." });
  }
};

// Delete an inventory item by ID
exports.deleteInventoryItem = async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item." });
  }
};
