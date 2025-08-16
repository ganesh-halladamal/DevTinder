const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const mongoose = require('mongoose');
const { saveBase64Image } = require('../utils/fileUpload');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Create new user with basic data
    user = await User.create({
      email,
      password,
      name
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error in registration'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(403).json({
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error in login'
    });
  }
};

// GitHub OAuth callback
exports.githubCallback = async (req, res) => {
  try {
    const token = generateToken(req.user);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};

// Google OAuth callback
exports.googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Explicitly include _id in the response
    const userProfile = user.getPublicProfile();
    res.json({
      user: userProfile
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      message: 'Error fetching user'
    });
  }
};

// Logout
exports.logout = (req, res) => {
  try {
    // Since we're using JWT, we just need to tell the client to remove the token
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Error in logout'
    });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return res.json({
        message: 'If your email address is in our database, you will receive a password reset link shortly.'
      });
    }

    // Generate password reset token
    await user.generatePasswordResetToken();

    // In a real implementation, you would send an email with the reset link
    // For now, we'll just return a success message
    console.log(`Password reset token for ${email}: ${user.resetPasswordToken}`);

    res.json({
      message: 'If your email address is in our database, you will receive a password reset link shortly.'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      message: 'Error in password reset request'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new token
    const newToken = generateToken(user);

    res.json({
      message: 'Password has been reset successfully',
      token: newToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Error in password reset'
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Verification token is invalid or has expired'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
      message: 'Email has been verified successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      message: 'Error in email verification'
    });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return res.json({
        message: 'If your email address is in our database, you will receive a verification link shortly.'
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    await user.generateVerificationToken();

    // In a real implementation, you would send an email with the verification link
    // For now, we'll just return a success message
    console.log(`Verification token for ${email}: ${user.verificationToken}`);

    res.json({
      message: 'If your email address is in our database, you will receive a verification link shortly.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      message: 'Error in resending verification email'
    });
  }
};