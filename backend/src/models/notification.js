const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['match', 'message', 'like', 'superlike', 'project_invite', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  data: {
    // Additional data related to the notification
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    actionUrl: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Static method to get unread notifications count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false
  });
};

// Static method to get notifications for a user with pagination
notificationSchema.statics.getUserNotifications = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const notifications = await this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name avatar')
    .lean();
  
  const total = await this.countDocuments({ recipient: userId });
  
  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to create a notification
notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = await this.create(notificationData);
  
  // Populate sender details
  await notification.populate('sender', 'name avatar');
  
  // Emit real-time notification via socket.io if available
  const io = global.io;
  if (io) {
    io.to(notification.recipient.toString()).emit('newNotification', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      sender: notification.sender,
      createdAt: notification.createdAt,
      data: notification.data
    });
  }
  
  return notification;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;