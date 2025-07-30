const { validationResult } = require('express-validator');
const User = require('../models/user');
const Match = require('../models/match');
const { saveBase64Image } = require('../utils/fileUpload');

// Get all users (basic listing)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get all users excluding current user
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('-password -github -google')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ _id: { $ne: req.user.id } });

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
    console.error('Get all users error:', error);
    res.status(500).json({
      message: 'Error fetching users'
    });
  }
};

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

    // Calculate stats - count only active matches for consistency with matches page
    const activeMatchesCount = await Match.countDocuments({
      users: req.params.id,
      status: 'active'
    });
    
    const stats = {
      projects: userProfile.projects?.length || 0,
      matches: activeMatchesCount
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

    // Calculate stats - count only active matches for consistency with matches page
    const activeMatchesCount = await Match.countDocuments({
      users: req.user.id,
      status: 'active'
    });
    
    const stats = {
      projects: user.projects?.length || 0,
      matches: activeMatchesCount
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
    
    // If there's a match, create a proper match record and add to both users
    if (isMatch) {
      // Add to matches array for both users
      if (!user.matches.includes(likedUser._id)) {
        user.matches.push(likedUser._id);
      }
      
      if (!likedUser.matches.includes(user._id)) {
        likedUser.matches.push(user._id);
      }
      
      // Create a proper match record in the Match collection
      const existingMatch = await Match.findOne({
        users: { $all: [req.user.id, likedUser._id] }
      });
      
      if (existingMatch) {
        // Update existing pending match to active
        existingMatch.status = 'active';
        await existingMatch.save();
      } else {
        // Calculate common interests and skills
        const commonInterests = user.interests.filter(interest =>
          likedUser.interests.includes(interest)
        );

        const commonSkills = user.skills
          .map(skill => skill.name)
          .filter(skillName =>
            likedUser.skills.some(s => s.name === skillName)
          );

        // Get primary skills (top 3 skills by proficiency)
        const primarySkills = likedUser.skills
          .sort((a, b) => {
            const proficiencyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
            return proficiencyOrder[b.proficiency] - proficiencyOrder[a.proficiency];
          })
          .slice(0, 3)
          .map(skill => skill.name);

        // Get project interests from project tech stacks
        const projectInterests = Array.from(new Set(
          likedUser.projects.flatMap(project => project.techStack || [])
        )).slice(0, 5);

        // Calculate match score based on common interests and skills
        const matchScore = Math.min(
          ((commonInterests.length * 5) + (commonSkills.length * 5)),
          100
        );

        // Create new match with active status
        const newMatch = await Match.create({
          users: [req.user.id, likedUser._id],
          matchScore,
          commonInterests,
          commonSkills,
          primarySkills,
          projectInterests,
          status: 'active'
        });

        // Populate match details
        await newMatch.populate({
          path: 'users',
          select: '-password -github -google',
          populate: {
            path: 'projects',
            select: 'title techStack description'
          }
        });

        // Emit socket event for new match
        const io = req.app.get('socketio');
        if (io) {
          io.emit('new_match', {
            matchId: newMatch._id,
            users: newMatch.users,
            matchScore: newMatch.matchScore,
            commonInterests: newMatch.commonInterests,
            commonSkills: newMatch.commonSkills,
            primarySkills: newMatch.primarySkills,
            projectInterests: newMatch.projectInterests
          });
        }
      }
      
      await Promise.all([user.save(), likedUser.save()]);
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
      availability,
      projectType,
      minExperience,
      maxExperience,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    let query = {
      _id: { $ne: req.user.id } // Exclude current user
    };

    // Text search across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { jobRole: { $regex: search, $options: 'i' } },
        { 'skills.name': { $regex: search, $options: 'i' } },
        { 'projects.title': { $regex: search, $options: 'i' } },
        { 'projects.techStack': { $regex: search, $options: 'i' } }
      ];
    }

    // Skills filter - exact match
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      query['skills.name'] = { $in: skillArray };
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Experience level filter (based on skill proficiency)
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

    // Experience range filter (based on number of projects)
    if (minExperience || maxExperience) {
      const projectCountQuery = {};
      
      if (minExperience) {
        projectCountQuery.$gte = parseInt(minExperience);
      }
      if (maxExperience) {
        projectCountQuery.$lte = parseInt(maxExperience);
      }
      
      query['projects.0'] = { $exists: true }; // At least one project
      // We'll filter by project count in memory for more complex queries
    }

    // Availability filter
    if (availability) {
      const availabilityArray = Array.isArray(availability) ? availability : [availability];
      query['settings.availability'] = { $in: availabilityArray };
    }

    // Project type filter
    if (projectType) {
      const projectTypes = Array.isArray(projectType) ? projectType : [projectType];
      query['projects.techStack'] = { $in: projectTypes };
    }

    // Interests filter
    if (interests) {
      const interestArray = Array.isArray(interests) ? interests : [interests];
      query.interests = { $in: interestArray };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get users with full data
    let users = await User.find(query)
      .select('-password -github -google')
      .lean();

    // Post-processing for advanced filters
    if (minExperience || maxExperience) {
      users = users.filter(user => {
        const projectCount = user.projects?.length || 0;
        if (minExperience && projectCount < parseInt(minExperience)) return false;
        if (maxExperience && projectCount > parseInt(maxExperience)) return false;
        return true;
      });
    }

    // Sorting
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'name': { name: 1 },
      'skills': { 'skills.length': -1 },
      'projects': { 'projects.length': -1 },
      'relevance': { 'skills.length': -1, 'projects.length': -1 }
    };

    // Apply sorting
    const sortOrder = sortOptions[sortBy] || sortOptions.newest;
    users.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'skills') {
        return (b.skills?.length || 0) - (a.skills?.length || 0);
      } else if (sortBy === 'projects') {
        return (b.projects?.length || 0) - (a.projects?.length || 0);
      } else if (sortBy === 'relevance') {
        const aScore = (a.skills?.length || 0) + (a.projects?.length || 0);
        const bScore = (b.skills?.length || 0) + (b.projects?.length || 0);
        return bScore - aScore;
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    // Pagination after filtering
    const total = users.length;
    const paginatedUsers = users.slice(skip, skip + parseInt(limit));

    res.json({
      users: paginatedUsers,
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