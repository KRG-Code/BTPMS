// routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
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
  getUnreadNotifications, // Import the getUnreadNotifications function
  markNotificationsAsRead, // Import the markNotificationsAsRead function
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
router.post('/auth/tanods/:tanodId/rate', protect, rateTanod); // Ensure this route is defined

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
router.put('/schedule/:scheduleId/end-patrol', protect, endPatrol);
router.post('/save-patrol-logs', protect, savePatrolLogs);
router.get('/patrol-logs/:userId/:scheduleId', protect, getPatrolLogs); // Update this route

// Notification routes
router.get('/notifications/unread', protect, getUnreadNotifications); // Ensure this route is defined
router.post('/notifications/mark-read', protect, markNotificationsAsRead); // Mark notifications as read
router.get('/auth/:tanodId/rating', getTanodRatings); // Ensure this route is defined

// Public token route
router.get('/public-token', generatePublicToken);

module.exports = router;
