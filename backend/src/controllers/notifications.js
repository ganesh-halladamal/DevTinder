const { validationResult } = require('express-validator');
const Notification = require('../models/notification');

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    let result;
    
    if (unreadOnly === 'true') {
      // Get only unread notifications
      const notifications = await Notification.find({ 
        recipient: userId, 
        read: false 
      })
      .sort({ createdAt: -1 })
      .populate('sender', 'name avatar')
      .lean();
      
      result = {
        notifications,
        pagination: {
          page: 1,
          limit: notifications.length,
          total: notifications.length,
          pages: 1
        }
      };
    } else {
      // Get all notifications with pagination
      result = await Notification.getUserNotifications(userId, parseInt(page), parseInt(limit));
    }

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      ...result,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      message: 'Error fetching notifications'
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      message: 'Error marking notification as read'
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      message: 'Error marking all notifications as read'
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      message: 'Error deleting notification'
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      message: 'Error fetching unread count'
    });
  }
};

// Create a notification (internal use)
exports.createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notificationData = req.body;
    const notification = await Notification.createNotification(notificationData);

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      message: 'Error creating notification'
    });
  }
};