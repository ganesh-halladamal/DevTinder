const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected', 'archived'],
    default: 'pending'
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  matchedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Remove automatic index creation to prevent conflicts
// We'll handle uniqueness in the application logic

// Pre-save hook to ensure consistent ordering of user IDs
matchSchema.pre('save', function(next) {
  // Ensure users array is sorted to prevent duplicates
  if (this.users && this.users.length === 2) {
    this.users.sort((a, b) => a.toString().localeCompare(b.toString()));
    
    // Set matchedAt timestamp when status changes to matched
    if (this.isModified('status') && this.status === 'matched' && !this.matchedAt) {
      this.matchedAt = new Date();
    }
  }
  next();
});

// Method to check if two users are matched
matchSchema.statics.areMatched = async function(userId1, userId2) {
  const match = await this.findOne({
    users: { $all: [userId1, userId2], $size: 2 },
    status: 'matched'
  });
  return !!match;
};

// Method to get match between two users
matchSchema.statics.findMatch = async function(userId1, userId2) {
  return this.findOne({
    users: { $all: [userId1, userId2], $size: 2 }
  });
};

// Method to get all matches for a user
matchSchema.statics.getUserMatches = async function(userId) {
  return this.find({
    users: userId,
    status: 'matched'
  })
  .populate('users', '-password -github -google')
  .populate('lastMessage')
  .sort({ updatedAt: -1 });
};

// Method to update unread count for a user
matchSchema.methods.updateUnreadCount = async function(userId, increment = 1) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), Math.max(0, currentCount + increment));
  return this.save();
};

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;