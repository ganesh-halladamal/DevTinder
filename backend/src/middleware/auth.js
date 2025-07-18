const passport = require('passport');

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

    req.user = user;
    next();
  })(req, res, next);
};

module.exports = auth;
module.exports.adminAuth = adminAuth; 