const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markNotificationsAsRead, getUnreadNotifications, deleteNotification } = require('../controllers/notificationController');

const router = express.Router();

// Route to get all notifications
router.get('/', protect, getNotifications);

// Route to mark all notifications as read
router.post('/mark-read', protect, markNotificationsAsRead);

router.get('/unread', protect, getUnreadNotifications); // Route to get unread notifications

router.post('/mark-read', protect, markNotificationsAsRead);

// Route to delete a notification
router.delete('/:notificationId', protect, deleteNotification);

module.exports = router;
