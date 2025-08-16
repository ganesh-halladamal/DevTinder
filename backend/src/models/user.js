const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  proficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  }
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  techStack: [String],
  repoUrl: String,
  liveUrl: String,
  images: [String]
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.github.id && !this.google.id;
    },
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  bio: String,
  avatar: String,
  location: String,
  jobRole: {
    type: String,
    default: 'Developer'
  },
  skills: [skillSchema],
  projects: [projectSchema],
  interests: [String],
  github: {
    id: String,
    username: String
  },
  google: {
    id: String,
    email: String
  },
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    portfolio: String
  },
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    showProfile: {
      type: Boolean,
      default: true
    },
    distance: {
      type: Number,
      default: 75,
      min: 5,
      max: 100
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'senior'],
      default: 'senior'
    },
    availability: {
      type: String,
      enum: ['full-time', 'part-time', 'freelance', 'weekends'],
      default: 'full-time'
    }
  },
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  unreadMessages: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // New fields for enhanced authentication
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  lastActive: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Get public profile method
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Ensure _id is explicitly present (MongoDB already includes it, but this is for clarity)
  userObject._id = userObject._id || this._id;
  
  delete userObject.password;
  delete userObject.github;
  delete userObject.google;
  delete userObject.dislikes;
  delete userObject.verificationToken;
  delete userObject.verificationTokenExpires;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If account is already locked and lock has expired, reset
  if (this.lockUntil && this.lockUntil <= Date.now()) {
    return this.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account if max attempts reached and not already locked
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock for 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to generate email verification token
userSchema.methods.generateVerificationToken = function() {
  const token = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
  
  this.verificationToken = token;
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return this.save();
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
  
  this.resetPasswordToken = token;
  this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 