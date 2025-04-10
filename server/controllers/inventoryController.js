const Inventory = require("../models/Inventory");
const Equipment = require("../models/Equipment"); 

// Fetch all inventory items
exports.getInventory = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find();
    console.log(`Found ${inventoryItems.length} inventory items`);
    
    // For each inventory item, count how many are currently borrowed
    const inventoryItemsWithBorrowedCount = await Promise.all(inventoryItems.map(async (item) => {
      // Use a case-insensitive regex match for more accurate item name matching
      const borrowedCount = await Equipment.countDocuments({
        name: { $regex: new RegExp(`^${item.name}$`, 'i') },
        returnDate: new Date("1970-01-01T00:00:00.000Z") // Default date for unreturned items
      });
      
      console.log(`Item "${item.name}": quantity=${item.quantity}, borrowed=${borrowedCount}, total=${item.total}`);
      
      // Convert to plain object and add borrowed count
      const itemObj = item.toObject();
      itemObj.currentlyBorrowed = borrowedCount;
      
      return itemObj;
    }));
    
    res.status(200).json(inventoryItemsWithBorrowedCount);
  } catch (error) {
    console.error("Error retrieving inventory:", error);
    res.status(500).json({ message: "Failed to retrieve inventory items." });
  }
};

// Add a new inventory item
exports.addInventoryItem = async (req, res) => {
  const { name, quantity, imageUrl } = req.body;

  if (!name || quantity == null) {
    return res.status(400).json({ message: "Name and quantity are required." });
  }

  try {
    const newItem = new Inventory({ 
      name, 
      quantity, 
      total: quantity,
      imageUrl: imageUrl || null 
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error adding inventory item:", error);
    res.status(500).json({ message: "Failed to add inventory item." });
  }
};

// Update an inventory item
exports.updateInventoryItem = async (req, res) => {
  const { quantity, imageUrl } = req.body;

  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Get current borrowed count directly from equipment collection
    const borrowedCount = await Equipment.countDocuments({
      name: { $regex: new RegExp(`^${item.name}$`, 'i') },
      returnDate: new Date("1970-01-01T00:00:00.000Z")
    });
    
    console.log(`Current borrowed count for ${item.name}: ${borrowedCount}`);

    // Create update object with defaults from existing item
    const updateData = {
      ...req.body,
    };
    
    // Only update imageUrl if provided
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    // Handle different update scenarios
    if (req.body.resetTotal) {
      // User wants to manually reset quantities and fix any discrepancies
      // Here we trust the provided quantity as the TOTAL count
      if (quantity !== undefined) {
        // Set total to the provided quantity (total items)
        updateData.total = Number(quantity);
        // Set available quantity to total minus borrowed
        updateData.quantity = Math.max(0, Number(quantity) - borrowedCount);
      } else {
        // No quantity provided, just fix the current quantities
        updateData.quantity = Math.max(0, item.total - borrowedCount);
      }
      console.log(`Reset for ${item.name}: total=${updateData.total}, available=${updateData.quantity}, borrowed=${borrowedCount}`);
    } 
    else if (req.body.syncTotal === true) {
      // Special case for borrow/return operations
      updateData.total = req.body.total;
    }
    else if (quantity !== undefined) {
      // Normal quantity update - interpret quantity as TOTAL
      // This is the key change - we now interpret quantity as the total amount
      updateData.total = Number(quantity);
      // Calculate available as total minus borrowed
      updateData.quantity = Math.max(0, Number(quantity) - borrowedCount);
      console.log(`Updating ${item.name} with total=${updateData.total}, available=${updateData.quantity}, borrowed=${borrowedCount}`);
    }

    console.log('Updating inventory item:', {
      id: req.params.id,
      oldData: { 
        quantity: item.quantity, 
        total: item.total,
        borrowed: item.total - item.quantity 
      },
      newData: { 
        quantity: updateData.quantity || item.quantity, 
        total: updateData.total,
        borrowed: borrowedCount
      }
    });

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    // Add borrowed count to response
    const responseItem = updatedItem.toObject();
    responseItem.currentlyBorrowed = borrowedCount;

    res.json(responseItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);
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
