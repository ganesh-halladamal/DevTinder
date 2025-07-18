const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
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
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ match: 1, createdAt: -1 });

// Method to mark message as read by a user
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.some(read => read.user.toString() === userId.toString())) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    this.status = 'read';
    await this.save();
  }
  return this;
};

// Method to get message details
messageSchema.methods.getMessageDetails = function() {
  return {
    id: this._id,
    match: this.match,
    sender: this.sender,
    content: this.content,
    attachments: this.attachments,
    status: this.status,
    readBy: this.readBy,
    createdAt: this.createdAt
  };
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 