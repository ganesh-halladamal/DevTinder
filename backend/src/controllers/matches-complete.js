const Match = require('../models/match');
const User = require('../models/user');
const Message = require('../models/message');

// GET /matches/my-matches - Get all matches for the authenticated user
const getMyMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'matched'
    })
    .populate('user1', 'name email avatar bio location jobRole skills')
    .populate('user2', 'name email avatar bio location jobRole skills')
    .sort({ updatedAt: -1 });

    // Get last message for each match
    const matchesWithMessages = await Promise.all(
      matches.map(async (match) => {
        const otherUser = match.user1._id.toString() === userId.toString() 
          ? match.user2 
          : match.user1;

        const lastMessage = await Message.findOne({
          matchId: match._id
        })
        .sort({ createdAt: -1 })
        .limit(1);

        return {
          _id: match._id,
          userId: otherUser._id,
          status: match.status,
          createdAt: match.createdAt,
          updatedAt: match.updatedAt,
          lastMessage: lastMessage ? {
            _id: lastMessage._id,
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
            read: lastMessage.read
          } : null,
          user: {
            _id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            avatar: otherUser.avatar,
            bio: otherUser.bio,
            location: otherUser.location,
            jobRole: otherUser.jobRole,
            skills: otherUser.skills
          }
        };
      })
    );

    res.json(matchesWithMessages);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
};

// GET /matches/:matchId - Get specific match details
const getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    const match = await Match.findOne({
      _id: matchId,
      $or: [{ user1: userId }, { user2: userId }]
    })
    .populate('user1', 'name email avatar bio location jobRole skills')
    .populate('user2', 'name email avatar bio location jobRole skills');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const otherUser = match.user1._id.toString() === userId.toString() 
      ? match.user2 
      : match.user1;

    const lastMessage = await Message.findOne({
      matchId: match._id
    })
    .sort({ createdAt: -1 })
    .limit(1);

    res.json({
      _id: match._id,
      userId: otherUser._id,
      status: match.status,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      lastMessage: lastMessage ? {
        _id: lastMessage._id,
        content: lastMessage.content,
        senderId: lastMessage.senderId,
        createdAt: lastMessage.createdAt,
        read: lastMessage.read
      } : null,
      user: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        avatar: otherUser.avatar,
        bio: otherUser.bio,
        location: otherUser.location,
        jobRole: otherUser.jobRole,
        skills: otherUser.skills
      }
    });
  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({ message: 'Error fetching match details' });
  }
};

// POST /matches/like/:userId - Like a user (create potential match)
const likeUser = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    // Check if user is trying to like themselves
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot like yourself' });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if a match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { user1: currentUserId, user2: targetUserId },
        { user1: targetUserId, user2: currentUserId }
      ]
    });

    if (existingMatch) {
      // If current user already liked/disliked this user
      if (existingMatch.user1.toString() === currentUserId.toString()) {
        return res.status(400).json({ message: 'You have already interacted with this user' });
      }
      
      // If target user already liked current user, create a match
      if (existingMatch.user1.toString() === targetUserId.toString() && existingMatch.status === 'pending') {
        existingMatch.status = 'matched';
        existingMatch.updatedAt = new Date();
        await existingMatch.save();
        
        // Populate the match with user data
        await existingMatch.populate('user1', 'name email avatar bio location jobRole skills');
        await existingMatch.populate('user2', 'name email avatar bio location jobRole skills');

        return res.json({
          message: 'It\'s a match!',
          isMatch: true,
          match: existingMatch
        });
      }
      
      return res.status(400).json({ message: 'You have already interacted with this user' });
    }

    // Create new pending match (current user likes target user)
    const newMatch = new Match({
      user1: currentUserId,
      user2: targetUserId,
      status: 'pending'
    });

    await newMatch.save();
    
    res.json({
      message: 'Like sent!',
      isMatch: false
    });
  } catch (error) {
    console.error('Error liking user:', error);
    res.status(500).json({ message: 'Error processing like' });
  }
};

// POST /matches/dislike/:userId - Dislike a user
const dislikeUser = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    // Check if user is trying to dislike themselves
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot dislike yourself' });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if a match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { user1: currentUserId, user2: targetUserId },
        { user1: targetUserId, user2: currentUserId }
      ]
    });

    if (existingMatch) {
      // If current user already interacted with this user
      if (existingMatch.user1.toString() === currentUserId.toString()) {
        return res.status(400).json({ message: 'You have already interacted with this user' });
      }
      
      // If target user liked current user, record the dislike
      if (existingMatch.user1.toString() === targetUserId && existingMatch.status === 'pending') {
        existingMatch.status = 'rejected';
        existingMatch.updatedAt = new Date();
        await existingMatch.save();
        
        return res.json({
          message: 'User disliked successfully'
        });
      }
      
      return res.status(400).json({ message: 'You have already interacted with this user' });
    }

    // Create new rejected match (current user dislikes target user)
    const newMatch = new Match({
      user1: currentUserId,
      user2: