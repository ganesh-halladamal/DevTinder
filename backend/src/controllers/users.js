const { validationResult } = require('express-validator');
const User = require('../models/user');
const { saveBase64Image } = require('../utils/fileUpload');

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

    // Calculate stats
    const stats = {
      projects: userProfile.projects?.length || 0,
      matches: userProfile.matches?.length || 0
    };

    console.log(`User found: ${user.name}`);
    res.json({ 
      user: userProfile,
      stats
    });
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
      // Log the validation errors for debugging
      console.error('Profile update validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Extract fields from request body
    const {
      name,
      bio,
      location,
      jobRole,
      skills,
      projects,
      interests,
      socialLinks,
      avatar
    } = req.body;

    // Log the incoming data for debugging
    console.log('Incoming profile update data:', {
      userId: req.user.id,
      name,
      jobRole,
      location,
      skills: skills?.length,
      projects: projects?.length,
      socialLinks: socialLinks ? Object.keys(socialLinks) : null
    });

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (jobRole !== undefined) {
      console.log('Setting jobRole in updates:', jobRole);
      updates.jobRole = jobRole;
    }
    if (skills !== undefined) updates.skills = skills;
    if (interests !== undefined) updates.interests = interests;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    
    // Process projects - handle temp IDs by creating proper MongoDB ObjectIDs
    if (projects !== undefined) {
      try {
        console.log('Processing projects:', JSON.stringify(projects));
        
        // Completely clean all projects of temporary IDs
        updates.projects = projects.map(project => {
          const { _id, ...projectData } = project;
          
          // If it's a temporary ID, return just the project data without the ID
          if (_id && _id.toString().startsWith('temp-')) {
            console.log(`Removing temporary ID ${_id} from project ${project.title}`);
            return projectData;
          }
          
          // If it's a valid MongoDB ID, keep it
          if (_id && /^[0-9a-fA-F]{24}$/.test(_id.toString())) {
            console.log(`Keeping valid ObjectID ${_id} for project ${project.title}`);
            return project;
          }
          
          // Default case - remove any non-standard ID
          console.log(`Removing non-standard ID ${_id} from project ${project.title}`);
          return projectData;
        });
        
        console.log('Processed projects:', JSON.stringify(updates.projects));
      } catch (error) {
        console.error('Error processing projects:', error);
        // Continue with the update, even if project processing fails
      }
    }
    
    // Handle avatar upload if it's a base64 string
    if (avatar && avatar.startsWith('data:image')) {
      try {
        console.log('Received base64 avatar image, starting upload process...');
        const avatarPath = await saveBase64Image(avatar, req.user.id);
        console.log('Avatar successfully saved at path:', avatarPath);
        updates.avatar = avatarPath;
      } catch (error) {
        console.error('Avatar upload error:', error);
        return res.status(400).json({
          message: error.message
        });
      }
    } else if (avatar !== undefined) {
      console.log('Received non-base64 avatar value:', avatar.substring(0, 50) + '...');
      updates.avatar = avatar;
    }

    console.log(`Updating profile for user ${req.user.id} with fields:`, 
      Object.keys(updates).join(', '));

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

    // Log the updated user data
    console.log('Updated user data:', {
      id: user._id,
      name: user.name,
      jobRole: user.jobRole,
      skillsCount: user.skills?.length,
      projectsCount: user.projects?.length
    });

    // Calculate stats
    const stats = {
      projects: user.projects?.length || 0,
      matches: user.matches?.length || 0
    };

    console.log(`Profile updated successfully for ${user.name}`);
    res.json({ 
      user,
      stats,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message
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
    
    // If there's a match, add to matches array for both users
    if (isMatch && !user.matches.includes(likedUser._id)) {
      user.matches.push(likedUser._id);
      await user.save();
      
      if (!likedUser.matches.includes(user._id)) {
        likedUser.matches.push(user._id);
        await likedUser.save();
      }
    }

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

// Search users with filters
exports.searchUsers = async (req, res) => {
  try {
    const {
      search,
      skills,
      location,
      experience,
      interests,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    let query = {
      _id: { $ne: req.user.id } // Exclude current user
    };

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { jobRole: { $regex: search, $options: 'i' } }
      ];
    }

    // Skills filter
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      query['skills.name'] = { $in: skillArray };
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Experience filter (based on skill proficiency)
    if (experience) {
      const experienceLevels = {
        'beginner': ['beginner', 'intermediate'],
        'intermediate': ['intermediate', 'advanced'],
        'senior': ['advanced', 'expert']
      };
      
      if (experienceLevels[experience]) {
        query['skills.proficiency'] = { $in: experienceLevels[experience] };
      }
    }

    // Interests filter
    if (interests) {
      const interestArray = Array.isArray(interests) ? interests : [interests];
      query.interests = { $in: interestArray };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const users = await User.find(query)
      .select('-password -github -google')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      message: 'Error searching users'
    });
  }
};