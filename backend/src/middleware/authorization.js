const Match = require('../models/match');
const Conversation = require('../models/conversation');
const User = require('../models/user');

// Middleware to check if users are matched and can access conversation
const canAccessConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a member of the conversation
    const isMember = conversation.members.some(
      memberId => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'You are not authorized to access this conversation'
      });
    }

    // Check if users are matched
    const match = await Match.findOne({
      users: { $all: conversation.members, $size: 2 },
      status: 'matched'
    });

    if (!match) {
      return res.status(403).json({
        message: 'You can only access conversations with matched users'
      });
    }

    // Check if both users have active accounts
    const otherUserId = conversation.members.find(id => id.toString() !== userId.toString());
    const otherUser = await User.findById(otherUserId);
    
    if (!otherUser || !otherUser.isActive) {
      return res.status(403).json({
        message: 'This conversation is no longer available'
      });
    }

    // Add conversation and match to request for use in controllers
    req.conversation = conversation;
    req.match = match;
    
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Middleware to check if users are matched
const areUsersMatched = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check if users are matched
    const match = await Match.findOne({
      users: { $all: [currentUserId, userId], $size: 2 },
      status: 'matched'
    });

    if (!match) {
      return res.status(403).json({
        message: 'You can only interact with matched users'
      });
    }

    // Check if both users have active accounts
    const otherUser = await User.findById(userId);
    
    if (!otherUser || !otherUser.isActive) {
      return res.status(403).json({
        message: 'This user is no longer active'
      });
    }

    // Add match to request for use in controllers
    req.match = match;
    
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Middleware to check if user can access a specific profile
const canAccessProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Users can always access their own profile
    if (userId === currentUserId.toString()) {
      return next();
    }

    // Check if target user exists and has an active account
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.isActive) {
      return res.status(403).json({
        message: 'This user is no longer active'
      });
    }

    // Check if users are matched
    const match = await Match.findOne({
      users: { $all: [currentUserId, userId], $size: 2 },
      status: 'matched'
    });

    if (!match) {
      return res.status(403).json({
        message: 'You can only view profiles of matched users'
      });
    }

    // Add match to request for use in controllers
    req.match = match;
    
    next();
  } catch (error) {
    console.error('Profile access authorization error:', error);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Middleware to check if user can view projects
const canViewProjects = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Users can always view their own projects
    if (userId === currentUserId.toString()) {
      return next();
    }

    // Check if target user exists and has an active account
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.isActive) {
      return res.status(403).json({
        message: 'This user is no longer active'
      });
    }

    // Check if users are matched
    const match = await Match.findOne({
      users: { $all: [currentUserId, userId], $size: 2 },
      status: 'matched'
    });

    if (!match) {
      return res.status(403).json({
        message: 'You can only view projects of matched users'
      });
    }

    // Add match to request for use in controllers
    req.match = match;
    
    next();
  } catch (error) {
    console.error('Project view authorization error:', error);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Middleware to check if user can send messages
const canSendMessage = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check if target user exists and has an active account
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.isActive) {
      return res.status(403).json({
        message: 'This user is no longer active'
      });
    }

    // Check if users are matched
    const match = await Match.findOne({
      users: { $all: [currentUserId, userId], $size: 2 },
      status: 'matched'
    });

    if (!match) {
      return res.status(403).json({
        message: 'You can only send messages to matched users'
      });
    }

    // Check if target user has blocked the current user
    if (targetUser.blockedUsers && targetUser.blockedUsers.includes(currentUserId)) {
      return res.status(403).json({
        message: 'You cannot send messages to this user'
      });
    }

    // Add match to request for use in controllers
    req.match = match;
    
    next();
  } catch (error) {
    console.error('Message send authorization error:', error);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Middleware to check if user is the owner of a resource
const isResourceOwner = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.userId;
      const currentUserId = req.user._id;

      // Find the resource (this is a generic middleware, so we'll need to get the model dynamically)
      const Model = req.resourceModel || User; // Default to User if no model is specified
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if current user is the owner
      if (resource[resourceField].toString() !== currentUserId.toString()) {
        return res.status(403).json({
          message: 'You are not authorized to access this resource'
        });
      }
      
      // Add resource to request for use in controllers
      req.resource = resource;
      
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

module.exports = {
  canAccessConversation,
  areUsersMatched,
  canAccessProfile,
  canViewProjects,
  canSendMessage,
  isResourceOwner
};