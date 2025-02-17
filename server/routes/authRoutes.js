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

router.post('/registertanod', [
  body('firstName').notEmpty().withMessage('First Name is required'),
  body('lastName').notEmpty().withMessage('Last Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], registerTanod);

router.post('/login/resident', loginResident); // For residents
router.post('/login/tanod', loginTanod);       // For Tanods

// User Profile & Ratings Routes
router.put('/update', protect, updateUserProfile);          // Update user profile
router.put('/change-password', protect, changePassword);    // Change user password
router.get('/:tanodId/ratings', protect, getTanodRatings);  // Ratings for specific Tanod
router.get('/my-ratings', protect, getUserRatings);         // Current user's ratings
router.get('/users', protect, getAllUserProfiles);          // Get all user profiles
router.get('/me', protect, getUserProfile);                 // Get current user profile
router.delete('/ratings/:ratingId', protect, deleteRating); // Delete a rating
router.delete('/users/:userId', protect, deleteUser);       // Delete user

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

module.exports = router;
