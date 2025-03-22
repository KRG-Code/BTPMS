// routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const mongoose = require('mongoose'); // Add this import
const TanodRating = require('../models/Rating'); // Add this import
const {
  registerUser,
  registerTanod,
  loginResident,
  loginTanod,
  getUserProfile,
  updateUserProfile,
  getAllUserProfiles,
  rateTanod,
  getTanodRatings,
  getUserRatings,
  deleteRating,
  deleteUser,
  getEquipments,
  updateEquipment,
  addEquipment,
  changePassword,
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getSchedulesForTanod,
  getScheduleMembers,
  updatePatrolArea,
  startPatrol,
  endPatrol,
  updateScheduleStatus,
  savePatrolLogs,
  getPatrolLogs,
  generatePublicToken,
  getUnreadNotifications,
  markNotificationsAsRead,
  logout,
  // Add these imports for the new functions
  getPatrolStats,
  getIncidentStats,
  getIncidentTypeBreakdown,
  getAttendanceStats,
  getEquipmentStats,
  getAssistanceStats,
  getPerformanceComparison
} = require('../controllers/authController');

const { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = require("../controllers/inventoryController");
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// User routes
router.post('/register', [
  body('firstName').notEmpty().withMessage('First Name is required'),
  body('lastName').notEmpty().withMessage('Last Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], registerUser);

router.post('/registertanod', protect, async (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to register tanods' });
  }
  next();
}, [
  body('firstName').notEmpty().withMessage('First Name is required'),
  body('lastName').notEmpty().withMessage('Last Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], registerTanod);

router.post('/login/resident', loginResident); // For residents
router.post('/login/tanod', loginTanod);       // For Tanods

// Update the logout route to use the imported function
router.post('/logout', protect, logout);

// User Profile & Ratings Routes
router.put('/update', protect, updateUserProfile);          // Update user profile - for all users
router.put('/change-password', protect, changePassword);    // Change password - for all users
router.put('/users/:userId/password', protect, async (req, res, next) => {
  // Admin middleware
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update other users' });
  }
  next();
}, changePassword); // For admin password reset
router.get('/:tanodId/ratings', protect, getTanodRatings);  // Ratings for specific Tanod
router.get('/my-ratings', protect, getUserRatings);         // Current user's ratings
router.get('/users', protect, getAllUserProfiles);          // Get all user profiles
router.get('/me', protect, getUserProfile);                 // Get current user profile
router.get('/users/:userId', protect, getUserProfile);       // Get user profile by userId
router.put('/users/:userId', protect, async (req, res, next) => {
  // Add admin check middleware
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update users' });
  }
  next();
}, updateUserProfile);
router.delete('/ratings/:ratingId', protect, deleteRating); // Delete a rating
router.delete('/users/:userId', protect, deleteUser);       // Delete user

router.get('/myratings', getUserRatings);         // Current user's ratings
router.get('/user', getAllUserProfiles);
router.get('/:tanodId/rating', getTanodRatings);    

router.post('/tanods/:tanodId/rate', rateTanod); // Ensure this route is defined
router.post('/auth/tanods/:tanodId/rate', rateTanod); // Ensure this route is defined

// Equipment Routes
router.get('/equipments', protect, getEquipments); // Get all borrowed equipments
router.post('/equipments', protect, addEquipment); // Borrow equipment
router.put('/equipments/:id', protect, updateEquipment); // Return equipment

// Inventory Routes
router.get('/inventory', protect, getInventory);          // Get inventory
router.post('/inventory', protect, addInventoryItem);     // Add item to inventory
router.put('/inventory/:id', protect, updateInventoryItem); // Update item
router.delete('/inventory/:id', protect, deleteInventoryItem); // Delete item

// Schedule routes
router.post('/schedule', protect, createSchedule);
router.get('/schedules', protect, getAllSchedules);
router.get('/schedule/:scheduleId', protect, getScheduleById);
router.put('/schedule/:scheduleId', protect, updateSchedule);
router.put('/schedule/:id/patrol-area', protect, updatePatrolArea); // Update patrol area of a schedule
router.delete('/schedule/:scheduleId', protect, deleteSchedule);
router.get('/schedule/:id/members', protect, getScheduleMembers);
router.get('/tanod-schedules/:userId', protect, getSchedulesForTanod); // Ensure this route is defined
router.put('/schedules/update-status', protect, updateScheduleStatus); // Add this route

// Patrol routes
router.put('/schedule/:scheduleId/start-patrol', protect, startPatrol);
router.put('/schedule/:id/end-patrol', protect, endPatrol); // Update this route to use controller
router.post('/save-patrol-logs', protect, savePatrolLogs);
router.get('/patrol-logs/:userId/:scheduleId', protect, getPatrolLogs);

// Add these new routes:
router.get('/:userId/patrol-stats', protect, getPatrolStats);
router.get('/:userId/incident-stats', protect, getIncidentStats);

// Add these new routes for performance dashboard data
router.get('/:userId/incident-types', protect, getIncidentTypeBreakdown);
router.get('/:userId/attendance-stats', protect, getAttendanceStats);
router.get('/:userId/equipment-stats', protect, getEquipmentStats);
router.get('/:userId/assistance-stats', protect, getAssistanceStats);
router.get('/:userId/performance-comparison', protect, getPerformanceComparison);

// Notification routes
router.get('/notifications/unread', protect, getUnreadNotifications); // Ensure this route is defined
router.post('/notifications/mark-read', protect, markNotificationsAsRead); // Mark notifications as read
router.get('/auth/:tanodId/rating', getTanodRatings); // Ensure this route is defined

// Public token route
router.get('/public-token', generatePublicToken);

// Add these debugging routes to help diagnose issues
router.get('/:userId/debug-schedules', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const schedules = await Schedule.find({ tanods: userObjectId })
      .select('unit startTime endTime status');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId/debug-incidents', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const incidents = await IncidentReport.find({ responder: userObjectId })
      .select('type status createdAt respondedAt');
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId/debug-equipment', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const equipment = await Equipment.find({ user: userObjectId });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add public routes for tanod evaluation
router.get('/auth/:tanodId/rating', getTanodRatings);  // Keep this existing route

// New route for anonymous ratings
router.post('/public/tanods/:tanodId/rate', async (req, res) => {
  const { tanodId } = req.params;
  const { rating, comment, fullName, identifier } = req.body;

  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating or comment" });
  }

  try {
    // Find or create rating document for this tanod
    let tanodRating = await TanodRating.findOne({ tanodId });
    
    if (!tanodRating) {
      tanodRating = new TanodRating({
        tanodId,
        ratings: []
      });
    }

    // For public ratings, we use the identifier to track anonymous users
    const ratingIndex = tanodRating.ratings.findIndex(
      r => r.identifier === identifier
    );

    if (ratingIndex > -1) {
      // Update existing rating from this anonymous user
      tanodRating.ratings[ratingIndex] = {
        ...tanodRating.ratings[ratingIndex],
        rating,
        comment,
        fullName: fullName || "Anonymous",
        createdAt: new Date()
      };
    } else {
      // Add new rating
      tanodRating.ratings.push({
        rating,
        comment,
        fullName: fullName || "Anonymous",
        identifier,
        createdAt: new Date()
      });
    }

    await tanodRating.save();
    
    return res.status(200).json({ 
      message: ratingIndex > -1 ? "Rating updated successfully" : "Rating submitted successfully",
    });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ message: "Error submitting rating" });
  }
});

module.exports = router;
