const Notification = require('../models/Notification');

// Get all notifications for a specific user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get unread notifications for the current user
exports.getUnreadNotifications = async (req, res) => {
    try {
      const unreadNotifications = await Notification.find({ userId: req.user.id, read: false });
      const hasUnread = unreadNotifications.length > 0;
      res.status(200).json({ hasUnread, notifications: unreadNotifications });
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Mark all notifications as read for the current user
  exports.markNotificationsAsRead = async (req, res) => {
    try {
      await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
      res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new notification (called when a schedule is added)
exports.createNotification = async (userId, message) => {
  try {
    const newNotification = new Notification({
      userId,
      message,
    });
    await newNotification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
