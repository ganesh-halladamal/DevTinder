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
  }]
}, {
  timestamps: true
});

// Ensure that a match is unique between two users
matchSchema.index({ users: 1 }, { unique: true });

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