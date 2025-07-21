const { validationResult } = require('express-validator');
const User = require('../models/user');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log(`Looking for user with ID: ${req.params.id}`);
    
    const user = await User.findById(req.params.id)
      .select('-password -github -google');
    
    if (!user) {
      console.log(`User not found with ID: ${req.params.id}`);
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Ensure ID is properly included
    const userProfile = user.toObject();
    userProfile._id = user._id;

    console.log(`User found: ${user.name}`);
    res.json({ user: userProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Error fetching profile'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {
      name: req.body.name,
      bio: req.body.bio,
      location: req.body.location,
      skills: req.body.skills,
      interests: req.body.interests,
      socialLinks: req.body.socialLinks
    };

    // Remove undefined fields
    Object.keys(updates).forEach(key => 
      updates[key] === undefined && delete updates[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -github -google');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Error updating profile'
    });
  }
};

// Get potential matches
exports.getPotentialMatches = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Get users who haven't been liked or disliked
    const potentialMatches = await User.find({
      _id: {
        $nin: [
          req.user.id,
          ...user.likes,
          ...user.dislikes
        ]
      }
    })
    .select('-password -github -google')
    .limit(10);

    res.json({ users: potentialMatches });
  } catch (error) {
    console.error('Get potential matches error:', error);
    res.status(500).json({
      message: 'Error fetching potential matches'
    });
  }
};

// Like a user
exports.likeUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const likedUser = await User.findById(req.params.id);

    if (!user || !likedUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if already liked
    if (user.likes.includes(likedUser._id)) {
      return res.status(400).json({
        message: 'User already liked'
      });
    }

    user.likes.push(likedUser._id);
    await user.save();

    // Check for mutual like
    const isMatch = likedUser.likes.includes(user._id);

    res.json({
      message: 'User liked successfully',
      isMatch
    });
  } catch (error) {
    console.error('Like user error:', error);
    res.status(500).json({
      message: 'Error liking user'
    });
  }
};

// Dislike a user
exports.dislikeUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if already disliked
    if (user.dislikes.includes(req.params.id)) {
      return res.status(400).json({
        message: 'User already disliked'
      });
    }

    user.dislikes.push(req.params.id);
    await user.save();

    res.json({
      message: 'User disliked successfully'
    });
  } catch (error) {
    console.error('Dislike user error:', error);
    res.status(500).json({
      message: 'Error disliking user'
    });
  }
}; 