const mongoose = require('mongoose');
const Message = require('./message');

const conversationSchema = new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Ensure that a conversation is unique between two users
conversationSchema.index({ 
  members: 1 
}, { unique: true });

// Pre-save hook to ensure consistent ordering of user IDs
conversationSchema.pre('save', function(next) {
  // Ensure members array is sorted to prevent duplicates
  if (this.members && this.members.length === 2) {
    this.members.sort((a, b) => a.toString().localeCompare(b.toString()));
  }
  next();
});

// Method to get conversation between two users
conversationSchema.statics.findConversation = async function(user1, user2) {
  return this.findOne({
    members: { $all: [user1, user2], $size: 2 }
  });
};

// Method to get all conversations for a user
conversationSchema.statics.getUserConversations = async function(userId) {
  return this.find({
    members: userId
  })
  .populate('members', '-password -github -google')
  .populate('lastMessage')
  .sort({ lastUpdated: -1 });
};

// Method to get conversations with unread counts and message previews
conversationSchema.statics.getUserConversationsWithDetails = async function(userId) {
  const conversations = await this.find({
    members: userId
  })
  .populate('members', '-password -github -google')
  .populate('lastMessage')
  .sort({ lastUpdated: -1 });

  // Get unread counts for each conversation
  const conversationIds = conversations.map(conv => conv._id);
  const unreadCounts = await Message.getUnreadCountPerConversation(userId);
  
  // Create a map of conversationId to unread count
  const unreadCountMap = {};
  unreadCounts.forEach(item => {
    unreadCountMap[item._id.toString()] = item.count;
  });

  // Get message previews for each conversation
  const conversationsWithPreviews = await Promise.all(
    conversations.map(async (conv) => {
      const preview = await Message.getMessagePreview(conv._id, 1);
      return {
        ...conv.toObject(),
        unreadCount: unreadCountMap[conv._id.toString()] || 0,
        preview: preview.length > 0 ? preview[0] : null
      };
    })
  );

  return conversationsWithPreviews;
};

// Method to update unread count for a user
conversationSchema.methods.updateUnreadCount = async function(userId, increment = 1) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), Math.max(0, currentCount + increment));
  this.lastUpdated = new Date();
  return this.save();
};

// Method to mark conversation as read for a user
conversationSchema.methods.markAsRead = async function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  this.lastUpdated = new Date();
  return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;