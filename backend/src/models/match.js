const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  matchedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  commonInterests: [{
    type: String
  }],
  commonSkills: [{
    type: String
  }],
  // New fields for enhanced match information
  primarySkills: [{
    type: String
  }],
  projectInterests: [{
    type: String
  }],
  isBookmarked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure that a match is unique between two users
// Add compound unique index on the sorted users array
matchSchema.index({ users: 1 }, { unique: true });

// Pre-save hook to ensure consistent ordering of user IDs
matchSchema.pre('save', function(next) {
  if (this.users && this.users.length === 2) {
    // Sort user IDs to ensure [user1, user2] and [user2, user1] are treated the same
    this.users = this.users.sort((a, b) => {
      const aStr = a.toString();
      const bStr = b.toString();
      return aStr.localeCompare(bStr);
    });
  }
  next();
});

// Method to check if two users are matched
matchSchema.statics.areMatched = async function(userId1, userId2) {
  const match = await this.findOne({
    users: { $all: [userId1, userId2] }
  });
  return !!match;
};

// Method to get match details
matchSchema.methods.getMatchDetails = function() {
  return {
    id: this._id,
    users: this.users,
    matchedAt: this.matchedAt,
    status: this.status,
    matchScore: this.matchScore,
    commonInterests: this.commonInterests,
    commonSkills: this.commonSkills,
    lastMessage: this.lastMessage
  };
};

const Match = mongoose.model('Match', matchSchema);

module.exports = Match; 