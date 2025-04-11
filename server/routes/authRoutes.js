// routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const mongoose = require('mongoose'); // Add this import
const authController = require('../controllers/authController'); // Add this import
const TanodRating = require('../models/Rating'); // Add this import
const User = require('../models/User'); // Add this import
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
  getPerformanceComparison,
  initiateTanodLogin,
  verifyTanodMfa,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  getTodaySchedulesForTanod
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
router.post('/login/tanod/initiate', initiateTanodLogin);  // Step 1: Initiate login and send code
router.post('/login/tanod/verify', verifyTanodMfa);        // Step 2: Verify code and complete login
router.post('/login/tanod/resend', resendVerificationCode); // Optional: Resend code

// Update the logout route to use the imported function
router.post('/logout', protect, logout);

// Add these new password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

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

// Add this new route to get equipment by user ID
router.get('/equipments/user/:userId/equipments', protect, async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Check if userId is valid
    const isValidUser = mongoose.Types.ObjectId.isValid(userId);
    if (!isValidUser) {
      return res.status(400).json({ message: 'Invalid userId' });
    }
    
    // Fetch the equipment for the user
    const equipments = await Equipment.find({ user: userId });
  
    // Return equipment even if it's an empty array
    res.status(200).json(equipments);
  } catch (error) {
    console.error('Error fetching equipment:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Inventory Routes
router.get('/inventory', protect, getInventory);          // Get inventory
router.post('/inventory', protect, addInventoryItem);     // Add item to inventory
router.put('/inventory/:id', protect, updateInventoryItem); // Update item
router.delete('/inventory/:id', protect, deleteInventoryItem); // Delete item

// Add route for equipment audit report
router.get('/inventory/equipment-audit-report', protect, authController.generateEquipmentAuditReport);

// Add route for combined inventory audit report
router.get('/inventory/combined-audit-report', protect, (req, res) => {
  // Route protection middleware to ensure only admin users can access
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to access combined reports' });
  }
  
  // Forward to the inventoryController
  const inventoryController = require('../controllers/inventoryController');
  return inventoryController.generateCombinedAuditReport(req, res);
});

// Schedule routes
router.post('/schedule', protect, createSchedule);
router.get('/schedules', protect, getAllSchedules);
router.get('/schedule/:scheduleId', protect, getScheduleById);
router.put('/schedule/:scheduleId', protect, updateSchedule);
router.put('/schedule/:id/patrol-area', protect, updatePatrolArea); // Update patrol area of a schedule
router.delete('/schedule/:scheduleId', protect, deleteSchedule);
router.get('/schedule/:id/members', protect, getScheduleMembers);
router.get('/tanod-schedules/:userId', protect, getSchedulesForTanod); // Ensure this route is defined
router.get('/tanod-schedules/:userId/today', protect, getTodaySchedulesForTanod);
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

// New public endpoint to get all tanod users
router.get('/public/tanods', async (req, res) => {
  try {
    const tanods = await User.find({ userType: 'tanod' })
      .select('_id firstName lastName profilePicture')
      .sort({ firstName: 1 });
    
    console.log(`Found ${tanods.length} tanod users`);
    res.status(200).json(tanods);
  } catch (error) {
    console.error('Error fetching public tanod list:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update the anonymous rating route to handle additional identifier
router.post('/public/tanods/:tanodId/rate', async (req, res) => {
  const { tanodId } = req.params;
  const { rating, comment, fullName, identifier, visitorIdentifier } = req.body;

  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating or comment" });
  }

  try {
    // Ensure tanodId is a valid MongoDB ObjectId
    const validTanodId = mongoose.Types.ObjectId.isValid(tanodId) 
      ? new mongoose.Types.ObjectId(tanodId) 
      : null;
    
    if (!validTanodId) {
      console.error(`Invalid tanodId format: ${tanodId}`);
      return res.status(400).json({ message: "Invalid tanod ID format" });
    }
    
    // Check if a rating with either identifier already exists
    const identifiersToCheck = [identifier];
    if (visitorIdentifier) identifiersToCheck.push(visitorIdentifier);
    
    const existingRating = await TanodRating.findOne({
      'ratings.identifier': { $in: identifiersToCheck }
    });
      
    if (existingRating) {
      return res.status(200).json({ 
        message: "You've already submitted feedback for this incident",
        alreadyRated: true
      });
    }

    // Find or create rating document for this tanod
    let tanodRating = await TanodRating.findOne({ tanodId: validTanodId });
    
    if (!tanodRating) {
      tanodRating = new TanodRating({
        tanodId: validTanodId,
        ratings: []
      });
    }

    // Add new rating with both identifiers for better tracking
    tanodRating.ratings.push({
      rating,
      comment,
      fullName: fullName || "Anonymous",
      identifier, // Primary identifier
      visitorIdentifier, // Secondary identifier if available
      createdAt: new Date()
    });

    await tanodRating.save();
    
    return res.status(200).json({ 
      message: "Rating submitted successfully"
    });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ message: "Error submitting rating" });
  }
});

// Update the rating check route to check both identifiers
router.get('/public/rating-check/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Find any rating with this identifier
    const existingRating = await TanodRating.findOne({
      $or: [
        { 'ratings.identifier': identifier },
        { 'ratings.visitorIdentifier': identifier }
      ]
    });
    
    res.status(200).json({ 
      hasRated: !!existingRating 
    });
  } catch (error) {
    console.error("Error checking rating status:", error);
    res.status(500).json({ message: "Error checking rating status" });
  }
});

// Add this new route for collective performance data
router.get('/tanod-performance/collective', protect, async (req, res) => {
  try {
    // Fix: Use req.query instead of req.params
    const { startDate, endDate, reportType } = req.query;
    console.log('Received request for collective report with parameters:', { startDate, endDate, reportType });
    
    // Verify the user is authorized (admin only)
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access collective reports' });
    }

    // Make sure we have the required model imports
    const Schedule = mongoose.model('Schedule');
    const IncidentReport = mongoose.model('IncidentReport');
    
    // Get all tanods
    const tanods = await User.find({ userType: 'tanod' });
    const totalTanods = tanods.length;
    
    console.log(`Found ${totalTanods} tanods for collective report`);
    
    // Initialize aggregates with default values
    const aggregates = {
      patrols: { total: 0, completed: 0, average: 0 },
      attendance: { average: 0, onTimeAverage: 0, totalAbsences: 0 },
      incidents: { total: 0, resolved: 0, responseRateAverage: 0 },
      ratings: { average: 0, totalRatings: 0 }
    };
    
    // Get data for each tanod
    const tanodData = await Promise.all(tanods.map(async tanod => {
      try {
        // Get patrol stats
        const patrolStats = await getPatrolStatsForTanod(tanod._id, startDate, endDate);
        
        // Get incident stats
        const incidentStats = await getIncidentStatsForTanod(tanod._id, startDate, endDate);
        
        // Get attendance stats
        const attendanceStats = await getAttendanceStatsForTanod(tanod._id, startDate, endDate);
        
        // Get rating data
        const ratingsData = await getRatingsForTanod(tanod._id);
        
        // Update aggregates safely using optional chaining and nullish coalescing
        aggregates.patrols.total += patrolStats?.totalPatrols ?? 0;
        aggregates.patrols.completed += patrolStats?.completedPatrols ?? 0;
        
        if (attendanceStats?.attendanceRate) {
          aggregates.attendance.average += parseFloat(attendanceStats.attendanceRate);
        }
        
        if (attendanceStats?.onTimeRate) {
          aggregates.attendance.onTimeAverage += parseFloat(attendanceStats.onTimeRate);
        }
        
        aggregates.attendance.totalAbsences += 
          (attendanceStats?.totalScheduled ?? 0) - (attendanceStats?.attended ?? 0);
        
        aggregates.incidents.total += incidentStats?.totalIncidentResponses ?? 0;
        aggregates.incidents.resolved += incidentStats?.resolvedIncidents ?? 0;
        
        if (incidentStats?.responseRate) {
          aggregates.incidents.responseRateAverage += parseFloat(incidentStats.responseRate);
        }
        
        if (ratingsData?.overallRating) {
          aggregates.ratings.average += parseFloat(ratingsData.overallRating);
        }
        
        aggregates.ratings.totalRatings += ratingsData?.comments?.length ?? 0;
        
        return {
          tanod: {
            _id: tanod._id,
            firstName: tanod.firstName,
            lastName: tanod.lastName,
            isTeamLeader: tanod.isTeamLeader
          },
          patrolStats,
          incidentStats,
          attendanceStats,
          ratingsData
        };
      } catch (err) {
        console.error(`Error processing tanod ${tanod._id}:`, err);
        // Return placeholder data for this tanod to prevent breaking the map
        return {
          tanod: {
            _id: tanod._id,
            firstName: tanod.firstName,
            lastName: tanod.lastName,
            isTeamLeader: tanod.isTeamLeader
          },
          patrolStats: { totalPatrols: 0, completedPatrols: 0 },
          incidentStats: { totalIncidentResponses: 0, resolvedIncidents: 0, responseRate: "0" },
          attendanceStats: { totalScheduled: 0, attended: 0, attendanceRate: "0" },
          ratingsData: { overallRating: "0.0", ratingCounts: [0, 0, 0, 0, 0], comments: [] }
        };
      }
    }));
    
    // Calculate averages
    if (totalTanods > 0) {
      aggregates.patrols.average = (aggregates.patrols.total / totalTanods).toFixed(1);
      aggregates.attendance.average = (aggregates.attendance.average / totalTanods).toFixed(1);
      aggregates.attendance.onTimeAverage = (aggregates.attendance.onTimeAverage / totalTanods).toFixed(1);
      aggregates.incidents.responseRateAverage = (aggregates.incidents.responseRateAverage / totalTanods).toFixed(1);
      aggregates.ratings.average = (aggregates.ratings.average / totalTanods).toFixed(1);
    }
    
    // Send response with all required data
    res.json({
      aggregates,
      tanodData,
      totalTanods,
      reportType: reportType || 'monthly',
      periodStart: startDate,
      periodEnd: endDate
    });
  } catch (error) {
    console.error('Error generating collective report:', error);
    res.status(500).json({ 
      message: 'Error generating collective report', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Fix helper functions to properly handle possible errors

async function getPatrolStatsForTanod(tanodId, startDate, endDate) {
  try {
    const userObjectId = new mongoose.Types.ObjectId(tanodId);
    
    // Set up date filters
    const dateFilter = {};
    if (startDate) dateFilter.startTime = { $gte: new Date(startDate) };
    if (endDate) dateFilter.endTime = { $lte: new Date(endDate) };
    
    // Make sure we have the required model
    const Schedule = mongoose.model('Schedule');
    
    // Get all schedules where this tanod is assigned
    const schedules = await Schedule.find({ 
      tanods: userObjectId,
      ...dateFilter
    });

    // Calculate stats
    const totalPatrols = schedules.length;
    const completedPatrols = schedules.filter(s => s.status === 'Completed').length;
    
    return {
      totalPatrols,
      completedPatrols
    };
  } catch (error) {
    console.error(`Error fetching patrol stats for tanod ${tanodId}:`, error);
    return { totalPatrols: 0, completedPatrols: 0 };
  }
}

async function getIncidentStatsForTanod(tanodId, startDate, endDate) {
  try {
    const userObjectId = new mongoose.Types.ObjectId(tanodId);
    
    // Set up date filters
    const dateFilter = {};
    if (startDate) dateFilter.createdAt = { $gte: new Date(startDate) };
    if (endDate) dateFilter.createdAt = { $lte: new Date(endDate) };
    
    // Make sure we have the required model
    const IncidentReport = mongoose.model('IncidentReport');
    
    // Get all incident reports handled by this tanod
    const incidents = await IncidentReport.find({
      responder: userObjectId,
      ...dateFilter
    });

    // Calculate stats
    const totalResponses = incidents.length;
    const resolvedIncidents = incidents.filter(i => i.status === 'Resolved').length;
    const responseRate = totalResponses > 0 ? 
        ((resolvedIncidents / totalResponses) * 100).toFixed(1) : '0';
    
    return {
      totalIncidentResponses: totalResponses,
      resolvedIncidents,
      responseRate
    };
  } catch (error) {
    console.error(`Error fetching incident stats for tanod ${tanodId}:`, error);
    return { totalIncidentResponses: 0, resolvedIncidents: 0, responseRate: '0' };
  }
}

async function getAttendanceStatsForTanod(tanodId, startDate, endDate) {
  try {
    const userObjectId = new mongoose.Types.ObjectId(tanodId);
    
    // Set up date filters
    const dateFilter = {};
    if (startDate) dateFilter.startTime = { $gte: new Date(startDate) };
    if (endDate) dateFilter.endTime = { $lte: new Date(endDate) };
    
    // Make sure we have the required model
    const Schedule = mongoose.model('Schedule');
    
    // Get all schedules where this tanod was assigned
    const schedules = await Schedule.find({
      tanods: userObjectId,
      ...dateFilter
    });

    const totalScheduled = schedules.length;

    // Find schedules where the tanod actually participated
    const attendedSchedules = schedules.filter(schedule => 
      schedule.patrolStatus && schedule.patrolStatus.some(status => 
        status.tanodId && status.tanodId.toString() === tanodId.toString() && 
        (status.status === 'Started' || status.status === 'Completed')
      )
    );

    const attended = attendedSchedules.length;
    const attendanceRate = totalScheduled > 0 ? 
        ((attended / totalScheduled) * 100).toFixed(1) : '0';

    return {
      totalScheduled,
      attended,
      attendanceRate
    };
  } catch (error) {
    console.error(`Error fetching attendance stats for tanod ${tanodId}:`, error);
    return { totalScheduled: 0, attended: 0, attendanceRate: '0' };
  }
}

async function getRatingsForTanod(tanodId) {
  try {
    // Make sure we have the required model
    const TanodRating = mongoose.model('TanodRating');
    
    const tanodRating = await TanodRating.findOne({ tanodId })
      .populate('ratings.userId', 'firstName lastName');

    if (!tanodRating) {
      return {
        overallRating: "0.0",
        ratingCounts: [0, 0, 0, 0, 0],
        comments: []
      };
    }

    const ratings = tanodRating.ratings || [];
    const overallRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : "0.0";

    const ratingCounts = [0, 0, 0, 0, 0];
    ratings.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating - 1]++;
      }
    });

    const comments = ratings.map(r => ({
      userId: r.userId?._id,
      fullName: r.fullName || (r.userId ? `${r.userId.firstName} ${r.userId.lastName}` : "Anonymous"),
      comment: r.comment,
      rating: r.rating,
      createdAt: r.createdAt
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      overallRating,
      ratingCounts,
      comments
    };
  } catch (error) {
    console.error(`Error fetching ratings for tanod ${tanodId}:`, error);
    return {
      overallRating: "0.0",
      ratingCounts: [0, 0, 0, 0, 0],
      comments: []
    };
  }
}

// Add this new route for password verification before generating reports
router.post('/verify-password', protect, async (req, res) => {
  try {
    const { password } = req.body;
    
    // Ensure the user is an admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied: Only administrators can verify for report generation',
        verified: false
      });
    }
    
    // Get the user with password field
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        verified: false 
      });
    }
    
    // Compare provided password with stored password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(200).json({ 
        message: 'Incorrect password',
        verified: false 
      });
    }
    
    // Password is correct
    return res.status(200).json({ 
      message: 'Password verified successfully',
      verified: true 
    });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ 
      message: 'Server error during password verification',
      verified: false 
    });
  }
});

module.exports = router;
