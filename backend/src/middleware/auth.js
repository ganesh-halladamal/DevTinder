const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to authenticate JWT token
const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        message: info ? info.message : 'Authentication required'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last activity timestamp
    User.findByIdAndUpdate(user._id, { lastActive: new Date() }).catch(err => {
      console.error('Error updating last activity:', err);
    });

    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to check admin role
const adminAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        message: info ? info.message : 'Authentication required'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to verify JWT token without passport (for specific use cases)
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devtinder_jwt_secret_fallback');
    
    // Find user and check if active
    User.findById(decoded.id).then(user => {
      if (!user) {
        return res.status(401).json({
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message: 'Account is deactivated. Please contact support.'
        });
      }

      req.user = user;
      next();
    }).catch(err => {
      console.error('Error finding user:', err);
      return res.status(500).json({
        message: 'Authentication error'
      });
    });
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user is verified (for email verification)
const isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      message: 'Please verify your email address to access this feature'
    });
  }
  next();
};

// Middleware to check if user has completed profile
const hasCompleteProfile = (req, res, next) => {
  const user = req.user;
  
  // Check if user has completed essential profile fields
  if (!user.bio || !user.skills || user.skills.length === 0) {
    return res.status(403).json({
      message: 'Please complete your profile before accessing this feature'
    });
  }
  
  next();
};

// Rate limiting middleware for authentication endpoints
const authRateLimit = {};
const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const AUTH_RATE_LIMIT_MAX = 5; // 5 attempts per window

const rateLimitAuth = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!authRateLimit[ip]) {
    authRateLimit[ip] = {
      count: 1,
      resetTime: now + AUTH_RATE_LIMIT_WINDOW
    };
    return next();
  }
  
  if (now > authRateLimit[ip].resetTime) {
    // Reset window
    authRateLimit[ip] = {
      count: 1,
      resetTime: now + AUTH_RATE_LIMIT_WINDOW
    };
    return next();
  }
  
  if (authRateLimit[ip].count >= AUTH_RATE_LIMIT_MAX) {
    return res.status(429).json({
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil((authRateLimit[ip].resetTime - now) / 1000)
    });
  }
  
  authRateLimit[ip].count++;
  next();
};

module.exports = {
  auth,
  adminAuth,
  verifyToken,
  isVerified,
  hasCompleteProfile,
  rateLimitAuth
};