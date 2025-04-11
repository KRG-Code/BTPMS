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

// Generate inventory audit report with enhanced analysis
exports.generateAuditReport = async (req, res) => {
  try {
    // Extract parameters for filtering
    const { reportType = 'monthly', startDate, endDate } = req.query;
    
    // Define date range based on report type
    const dateRange = getDateRangeFromReportType(reportType, startDate, endDate);
    
    // Get inventory items
    const inventoryItems = await Inventory.find();
    
    // Get equipment transactions within the date range
    const equipmentTransactions = await Equipment.find({
      $or: [
        { borrowDate: { $gte: dateRange.startDate, $lte: dateRange.endDate } },
        { returnDate: { $gte: dateRange.startDate, $lte: dateRange.endDate } },
        { 
          borrowDate: { $lte: dateRange.endDate },
          returnDate: "1970-01-01T00:00:00.000Z" // Items that are still borrowed
        }
      ]
    }).populate('user', 'firstName lastName profilePicture');
    
    // Calculate inventory statistics
    const totalItems = inventoryItems.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0);
    const availableItems = inventoryItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const borrowedItems = totalItems - availableItems;
    
    // Calculate borrowed and returned counts
    const borrowedInPeriod = equipmentTransactions.filter(
      tx => new Date(tx.borrowDate) >= dateRange.startDate && new Date(tx.borrowDate) <= dateRange.endDate
    ).length;
    
    const returnedInPeriod = equipmentTransactions.filter(
      tx => tx.returnDate !== "1970-01-01T00:00:00.000Z" && 
            new Date(tx.returnDate) >= dateRange.startDate && 
            new Date(tx.returnDate) <= dateRange.endDate
    ).length;
    
    // Calculate return rate
    const returnRate = borrowedInPeriod > 0 ? ((returnedInPeriod / borrowedInPeriod) * 100).toFixed(1) : 0;
    
    // Group by month for trend analysis
    const monthlyBorrowingTrends = getMonthlyTrends(equipmentTransactions, 'borrowDate', dateRange);
    
    // Get unique users who borrowed equipment
    const uniqueBorrowers = [...new Set(equipmentTransactions.map(tx => tx.user?._id?.toString()))].length;
    
    // Process top borrowers
    const borrowerStats = {};
    equipmentTransactions.forEach(tx => {
      const userId = tx.user?._id?.toString();
      if (!userId) return;
      
      if (!borrowerStats[userId]) {
        borrowerStats[userId] = {
          userId,
          name: `${tx.user.firstName || ''} ${tx.user.lastName || ''}`.trim(),
          itemsBorrowed: 0,
          itemsReturned: 0,
          pendingReturns: 0,
          lastBorrowedDate: null
        };
      }
      
      borrowerStats[userId].itemsBorrowed++;
      
      if (tx.returnDate !== "1970-01-01T00:00:00.000Z") {
        borrowerStats[userId].itemsReturned++;
      } else {
        borrowerStats[userId].pendingReturns++;
      }
      
      // Track latest borrow date
      const borrowDate = new Date(tx.borrowDate);
      if (!borrowerStats[userId].lastBorrowedDate || 
          borrowDate > new Date(borrowerStats[userId].lastBorrowedDate)) {
        borrowerStats[userId].lastBorrowedDate = tx.borrowDate;
      }
    });
    
    // Convert to array and sort by items borrowed
    const topBorrowers = Object.values(borrowerStats)
      .sort((a, b) => b.itemsBorrowed - a.itemsBorrowed)
      .slice(0, 10);
    
    // Process most borrowed items
    const itemStats = {};
    equipmentTransactions.forEach(tx => {
      const itemName = tx.name;
      if (!itemName) return;
      
      if (!itemStats[itemName]) {
        const inventoryItem = inventoryItems.find(item => item.name === itemName);
        itemStats[itemName] = {
          name: itemName,
          borrowCount: 0,
          total: inventoryItem ? inventoryItem.total : 0,
          quantity: inventoryItem ? inventoryItem.quantity : 0,
          imageUrl: inventoryItem ? inventoryItem.imageUrl : null
        };
      }
      
      itemStats[itemName].borrowCount++;
    });
    
    // Convert to array and sort by borrow count
    const mostBorrowedItems = Object.values(itemStats)
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10);
    
    // Process recent transactions
    const recentTransactions = equipmentTransactions
      .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate))
      .slice(0, 20)
      .map(tx => ({
        borrowDate: tx.borrowDate,
        returnDate: tx.returnDate,
        userName: tx.user ? `${tx.user.firstName || ''} ${tx.user.lastName || ''}`.trim() : 'Unknown User',
        itemName: tx.name || 'Unknown Item',
        status: tx.returnDate !== "1970-01-01T00:00:00.000Z" ? 'Returned' : 'Borrowed',
        daysKept: tx.returnDate !== "1970-01-01T00:00:00.000Z" ? 
          Math.ceil((new Date(tx.returnDate) - new Date(tx.borrowDate)) / (1000 * 60 * 60 * 24)) : 
          Math.ceil((new Date() - new Date(tx.borrowDate)) / (1000 * 60 * 60 * 24))
      }));
    
    // Identify potential inventory issues/alerts
    const inventoryAlerts = [];
    
    // Check for low stock items (less than 20% available)
    inventoryItems.forEach(item => {
      const availablePercentage = (item.quantity / Math.max(item.total, 1)) * 100;
      
      if (availablePercentage <= 20) {
        inventoryAlerts.push({
          itemName: item.name,
          alertType: 'Low Stock',
          severity: availablePercentage <= 10 ? 'High' : 'Medium',
          issue: `Only ${item.quantity} out of ${item.total} available (${availablePercentage.toFixed(1)}%)`,
          recommendation: `Acquire additional ${item.name} units or request returns from borrowers`
        });
      }
    });
    
    // Check for items with many pending returns
    Object.values(itemStats).forEach(item => {
      const pendingReturns = item.total - item.quantity;
      const pendingPercentage = (pendingReturns / Math.max(item.total, 1)) * 100;
      
      if (pendingPercentage >= 50 && pendingReturns >= 5) {
        inventoryAlerts.push({
          itemName: item.name,
          alertType: 'High Non-Return Rate',
          severity: pendingPercentage >= 75 ? 'High' : 'Medium',
          issue: `${pendingReturns} units (${pendingPercentage.toFixed(1)}%) have not been returned`,
          recommendation: `Follow up with borrowers to return ${item.name} units`
        });
      }
    });

    // Calculate equipment statistics
    const equipmentStats = {
      totalItems,
      availableItems,
      borrowedItems,
      borrowedInPeriod,
      returnedItems: returnedInPeriod,
      returnRate: parseFloat(returnRate),
      totalTransactions: equipmentTransactions.length,
      uniqueBorrowers,
      maxMonthlyBorrows: Math.max(...monthlyBorrowingTrends.map(m => m.count), 0)
    };
    
    // Return complete report data with correct structure
    res.json({
      equipmentStats,
      monthlyBorrowingTrends,
      topBorrowers,
      mostBorrowedItems,
      recentTransactions,
      inventoryAlerts,
      reportPeriod: {
        reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
    });
  } catch (error) {
    console.error('Error generating audit report:', error);
    res.status(500).json({ 
      message: 'Error generating audit report', 
      error: error.message 
    });
  }
};

// Generate combined audit report for equipment and vehicles
exports.generateCombinedAuditReport = async (req, res) => {
  try {
    // Extract parameters for filtering
    const { reportType = 'monthly', startDate, endDate } = req.query;
    
    // Define date range based on report type
    const dateRange = getDateRangeFromReportType(reportType, startDate, endDate);
    
    // Get equipment data
    const equipmentData = await Equipment.find({
      $or: [
        { borrowDate: { $gte: dateRange.startDate, $lte: dateRange.endDate } },
        { returnDate: { $gte: dateRange.startDate, $lte: dateRange.endDate } },
        { 
          borrowDate: { $lte: dateRange.endDate },
          returnDate: "1970-01-01T00:00:00.000Z" // Items that are still borrowed
        }
      ]
    }).populate('user', 'firstName lastName profilePicture');
    
    // Get inventory items
    const inventoryItems = await Inventory.find();
    
    // Get vehicle data
    const vehicleData = await VehicleUsage.find({
      date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
    }).populate('vehicleId').populate('userId', 'firstName lastName profilePicture');
    
    // Get all vehicles
    const vehicles = await Vehicle.find().populate('assignedDriver', 'firstName lastName profilePicture');
    
    // Process equipment statistics similar to generateAuditReport
    const totalItems = inventoryItems.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0);
    const availableItems = inventoryItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const borrowedItems = totalItems - availableItems;
    
    // Calculate borrowed and returned counts
    const borrowedInPeriod = equipmentData.filter(
      tx => new Date(tx.borrowDate) >= dateRange.startDate && new Date(tx.borrowDate) <= dateRange.endDate
    ).length;
    
    const returnedInPeriod = equipmentData.filter(
      tx => tx.returnDate !== "1970-01-01T00:00:00.000Z" && 
            new Date(tx.returnDate) >= dateRange.startDate && 
            new Date(tx.returnDate) <= dateRange.endDate
    ).length;
    
    // Calculate return rate
    const returnRate = borrowedInPeriod > 0 ? ((returnedInPeriod / borrowedInPeriod) * 100).toFixed(1) : 0;
    
    // Equipment statistics
    const equipmentStats = {
      totalItems,
      availableItems,
      borrowedItems,
      borrowedInPeriod,
      returnedItems: returnedInPeriod,
      returnRate: parseFloat(returnRate),
      totalTransactions: equipmentData.length,
      uniqueBorrowers: [...new Set(equipmentData.map(tx => tx.user?._id?.toString()))].length
    };
    
    // Vehicle statistics
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'In Use').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'Maintenance').length;
    const totalTrips = vehicleData.length;
    
    // Calculate total and average mileage
    const totalMileage = vehicleData.reduce((sum, usage) => {
      // Calculate mileage used from start/end if available, or use the stored mileageUsed
      const mileage = usage.mileageUsed || 
        (usage.endMileage && usage.startMileage ? 
         Math.max(0, usage.endMileage - usage.startMileage) : 0);
      return sum + mileage;
    }, 0);
    
    const averageMileage = totalTrips > 0 ? (totalMileage / totalTrips).toFixed(1) : 0;
    
    // Get most common trip reason
    const reasonCounts = {};
    vehicleData.forEach(usage => {
      const reason = usage.reason || 'Unspecified';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    let mostCommonReason = 'None';
    let mostCommonReasonCount = 0;
    let mostCommonReasonPercent = 0;
    
    if (totalTrips > 0) {
      for (const [reason, count] of Object.entries(reasonCounts)) {
        if (count > mostCommonReasonCount) {
          mostCommonReason = reason;
          mostCommonReasonCount = count;
        }
      }
      mostCommonReasonPercent = ((mostCommonReasonCount / totalTrips) * 100).toFixed(1);
    }
    
    // Monthly trends for vehicles
    const monthlyVehicleUsage = getMonthlyTrends(vehicleData, 'date', dateRange);
    
    // Process most used vehicles
    const vehicleUsageStats = {};
    vehicleData.forEach(usage => {
      const vehicleId = usage.vehicleId?._id?.toString();
      if (!vehicleId) return;
      
      if (!vehicleUsageStats[vehicleId]) {
        vehicleUsageStats[vehicleId] = {
          vehicleId,
          name: usage.vehicleId.name,
          licensePlate: usage.vehicleId.licensePlate,
          model: usage.vehicleId.model,
          status: usage.vehicleId.status,
          tripCount: 0,
          totalMileage: 0,
          imageUrl: usage.vehicleId.imageUrl
        };
      }
      
      vehicleUsageStats[vehicleId].tripCount++;
      
      const mileage = usage.mileageUsed || 
        (usage.endMileage && usage.startMileage ? 
         Math.max(0, usage.endMileage - usage.startMileage) : 0);
      
      vehicleUsageStats[vehicleId].totalMileage += mileage;
    });
    
    // Convert to array and sort by trip count
    const mostUsedVehicles = Object.values(vehicleUsageStats)
      .sort((a, b) => b.tripCount - a.tripCount)
      .slice(0, 10);
    
    // Process top drivers
    const driverStats = {};
    vehicleData.forEach(usage => {
      const userId = usage.userId?._id?.toString();
      if (!userId) return;
      
      if (!driverStats[userId]) {
        driverStats[userId] = {
          userId,
          name: `${usage.userId.firstName || ''} ${usage.userId.lastName || ''}`.trim(),
          tripCount: 0,
          totalMileage: 0,
          reasons: {}
        };
      }
      
      driverStats[userId].tripCount++;
      
      const mileage = usage.mileageUsed || 
        (usage.endMileage && usage.startMileage ? 
         Math.max(0, usage.endMileage - usage.startMileage) : 0);
      
      driverStats[userId].totalMileage += mileage;
      
      // Track reasons
      const reason = usage.reason || 'Unspecified';
      driverStats[userId].reasons[reason] = (driverStats[userId].reasons[reason] || 0) + 1;
    });
    
    // Find most common reason for each driver and add to their stats
    Object.values(driverStats).forEach(driver => {
      let maxCount = 0;
      let mostCommon = 'None';
      
      for (const [reason, count] of Object.entries(driver.reasons)) {
        if (count > maxCount) {
          maxCount = count;
          mostCommon = reason;
        }
      }
      
      driver.mostCommonReason = mostCommon;
    });
    
    // Convert to array and sort by trip count
    const topDrivers = Object.values(driverStats)
      .sort((a, b) => b.tripCount - a.tripCount)
      .slice(0, 10);
    
    // Process recent equipment transactions
    const recentEquipmentTransactions = equipmentData
      .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate))
      .slice(0, 10)
      .map(tx => ({
        borrowDate: tx.borrowDate,
        returnDate: tx.returnDate,
        userName: tx.user ? `${tx.user.firstName || ''} ${tx.user.lastName || ''}`.trim() : 'Unknown User',
        itemName: tx.name || 'Unknown Item',
        status: tx.returnDate !== "1970-01-01T00:00:00.000Z" ? 'Returned' : 'Borrowed'
      }));
    
    // Process recent vehicle transactions
    const recentVehicleTransactions = vehicleData
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(tx => ({
        date: tx.date,
        userName: tx.userId ? `${tx.userId.firstName || ''} ${tx.userId.lastName || ''}`.trim() : 'Unknown User',
        vehicleName: tx.vehicleId?.name || 'Unknown Vehicle',
        startMileage: tx.startMileage || 0,
        endMileage: tx.endMileage || 0,
        mileageUsed: tx.mileageUsed || 
          (tx.endMileage && tx.startMileage ? 
           Math.max(0, tx.endMileage - tx.startMileage) : 0),
        reason: tx.reason || 'Unspecified'
      }));
    
    // Vehicle statistics
    const vehicleStats = {
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalTrips,
      totalMileage,
      averageMileage: parseFloat(averageMileage),
      mostCommonReason,
      mostCommonReasonPercent: parseFloat(mostCommonReasonPercent),
      maxMonthlyUsage: Math.max(...monthlyVehicleUsage.map(m => m.count), 0)
    };
    
    // Return complete report data
    res.json({
      equipmentStats,
      vehicleStats,
      topBorrowers: [],
      mostActiveItems: [],
      mostUsedVehicles,
      topDrivers,
      recentEquipmentTransactions,
      recentVehicleTransactions,
      monthlyBorrowingTrends: getMonthlyTrends(equipmentData, 'borrowDate', dateRange),
      monthlyVehicleUsage,
      reportPeriod: {
        reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
    });
  } catch (error) {
    console.error('Error generating combined audit report:', error);
    res.status(500).json({ 
      message: 'Error generating combined audit report', 
      error: error.message 
    });
  }
};

// Add the missing saveAuditReport function
exports.saveAuditReport = async (req, res) => {
  try {
    const { reportType, period, startDate, endDate, reportData } = req.body;
    
    if (!reportType || !period || !startDate || !endDate || !reportData) {
      return res.status(400).json({ message: 'Missing required report data' });
    }
    
    // Check if AuditReport model exists
    let AuditReport;
    try {
      AuditReport = require('../models/AuditReport');
    } catch (error) {
      console.error('AuditReport model not found:', error);
      return res.status(500).json({ message: 'AuditReport model not available' });
    }
    
    // Create a new audit report record
    const newReport = new AuditReport({
      reportType,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      generatedBy: req.user._id, // Current authenticated user
      reportData
    });
    
    await newReport.save();
    
    res.status(201).json({ 
      message: 'Audit report saved successfully',
      reportId: newReport._id
    });
  } catch (error) {
    console.error('Error saving audit report:', error);
    res.status(500).json({ 
      message: 'Failed to save audit report', 
      error: error.message 
    });
  }
};

// Helper function to calculate return rate
function calculateReturnRate(equipments) {
  const totalBorrowed = equipments.length;
  const totalReturned = equipments.filter(eq => 
    eq.returnDate && eq.returnDate !== "1970-01-01T00:00:00.000Z"
  ).length;
  
  return totalBorrowed > 0 ? (totalReturned / totalBorrowed) * 100 : 0;
}

// Helper function to get unique categories
function getUniqueCategories(items) {
  const categories = new Set();
  items.forEach(item => {
    if (item.category) categories.add(item.category);
  });
  return Array.from(categories);
}

// Helper function to get monthly trends
function getMonthlyTrends(data, dateField, dateRange) {
  // Start with first day of the month from startDate
  const startMonth = new Date(dateRange.startDate);
  startMonth.setDate(1);
  
  // End with last day of the month from endDate
  const endMonth = new Date(dateRange.endDate);
  endMonth.setMonth(endMonth.getMonth() + 1, 0);
  
  const months = [];
  let currentMonth = new Date(startMonth);
  
  // Create an array of month ranges
  while (currentMonth <= endMonth) {
    // Create last day of current month
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    months.push({
      name: currentMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      startDate: new Date(currentMonth),
      endDate: new Date(lastDayOfMonth),
      count: 0
    });
    
    // Move to next month
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  // Count data points for each month
  data.forEach(item => {
    const itemDate = new Date(item[dateField]);
    
    for (const month of months) {
      if (itemDate >= month.startDate && itemDate <= month.endDate) {
        month.count++;
        break;
      }
    }
  });
  
  return months;
}

// Helper function to calculate date range
function getDateRangeFromReportType(reportType, startDateStr, endDateStr) {
  const now = new Date();
  let startDate, endDate;
  
  if (startDateStr && endDateStr) {
    // Custom date range
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
  } else {
    // Calculate based on report type
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    switch (reportType) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'annual':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    
    startDate.setHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate };
}
