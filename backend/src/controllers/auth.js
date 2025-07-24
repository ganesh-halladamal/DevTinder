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

    const { email, password, name, avatar, projects } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Handle avatar upload if provided
    let avatarPath;
    if (avatar && avatar.startsWith('data:image')) {
      try {
        console.log('Processing avatar image during registration...');
        // Create a temporary ID for the file upload since we don't have a user ID yet
        const tempId = new mongoose.Types.ObjectId();
        avatarPath = await saveBase64Image(avatar, tempId);
        console.log('Avatar saved successfully:', avatarPath);
      } catch (error) {
        console.error('Avatar upload error during registration:', error);
        return res.status(400).json({
          message: 'Error uploading profile image: ' + error.message
        });
      }
    }

    // Process projects if provided
    let processedProjects = [];
    if (projects && Array.isArray(projects)) {
      processedProjects = await Promise.all(projects.map(async project => {
        const { images, ...projectData } = project;
        
        // Handle project images if any
        const processedImages = [];
        if (images && Array.isArray(images)) {
          for (const image of images) {
            if (image && image.startsWith('data:image')) {
              try {
                const tempId = new mongoose.Types.ObjectId();
                const imagePath = await saveBase64Image(image, tempId);
                processedImages.push(imagePath);
              } catch (error) {
                console.error('Project image upload error:', error);
                // Continue with other images if one fails
              }
            } else if (image) {
              processedImages.push(image);
            }
          }
        }

        return {
          ...projectData,
          images: processedImages
        };
      }));
    }

    // Create new user with all data
    user = await User.create({
      email,
      password,
      name,
      avatar: avatarPath,
      projects: processedProjects
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

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

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