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
    pushNotifications: {
      type: Boolean,
      default: false
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
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
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
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 