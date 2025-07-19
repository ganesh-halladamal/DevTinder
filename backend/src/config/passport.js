const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

console.log('JWT_SECRET:', process.env.JWT_SECRET);

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'devtinder_jwt_secret_fallback'
};

console.log('JWT options:', jwtOptions);

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// GitHub Strategy - Only add if credentials are available
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    scope: ['user:email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 'github.id': profile.id });

      if (!user) {
        user = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName || profile.username,
          github: {
            id: profile.id,
            username: profile.username
          },
          avatar: profile.photos[0].value
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
}

// Google Strategy - Only add if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 'google.id': profile.id });

      if (!user) {
        user = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          google: {
            id: profile.id,
            email: profile.emails[0].value
          },
          avatar: profile.photos[0].value
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
} 