const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'link', 'code'],
      required: true
    },
    url: String,
    preview: String,
    language: String // for code snippets
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    this.status = 'read';
    await this.save();
  }
  return this;
};

// Method to get message details
messageSchema.methods.getMessageDetails = function() {
  return {
    id: this._id,
    conversationId: this.conversationId,
    sender: this.sender,
    receiver: this.receiver,
    text: this.text,
    attachments: this.attachments,
    status: this.status,
    read: this.read,
    readAt: this.readAt,
    createdAt: this.createdAt
  };
};

// Static method to get unread messages count for a user
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    receiver: userId,
    read: false
  });
};

// Static method to get unread messages count per conversation for a user
messageSchema.statics.getUnreadCountPerConversation = async function(userId) {
  const pipeline = [
    {
      $match: {
        receiver: userId,
        read: false
      }
    },
    {
      $group: {
        _id: "$conversationId",
        count: { $sum: 1 }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get message preview for a conversation
messageSchema.statics.getMessagePreview = async function(conversationId, limit = 3) {
  return this.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name avatar')
    .select('text createdAt sender');
};

// Static method to get messages between two users
messageSchema.statics.getConversation = async function(user1, user2, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender', 'name avatar')
  .populate('receiver', 'name avatar');
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 