const Match = require('../models/match');
const User = require('../models/user');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

// GET /matches/my-matches - Get all matches for the authenticated user
const getMyMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Fetching matches for user:', userId);
    
    // Get user for logging
    const user = await User.findById(userId);
    console.log('Current user:', user.name);
    console.log('User email:', user.email);
    
    // Get all matches for the user using the new schema method with optimized population
    const matches = await Match.find({
      users: userId,
      status: 'matched'
    })
    .populate('users', '-password -github -google -dislikes -blockedUsers -verificationToken -resetPasswordToken')
    .populate({
      path: 'lastMessage',
      select: 'text sender createdAt read'
    })
    .sort({ updatedAt: -1 })
    .lean(); // Use lean for better performance
    
    console.log('Found matches:', matches.length);
    console.log('Match details:', matches.map(m => ({ 
      id: m._id, 
      users: m.users.map(u => ({ id: u._id, name: u.name })),
      status: m.status 
    })));

    const matchesWithDetails = matches.map((match) => {
      // Determine which user is the other person in the match
      const otherUser = match.users.find(u => u._id.toString() !== userId.toString());
      
      if (!otherUser) {
        console.error('ERROR: Could not find other user in match', {
          matchId: match._id,
          currentUserId: userId,
          usersInMatch: match.users.map(u => ({ id: u._id, name: u.name }))
        });
        return null;
      }
        
      console.log('Processing match with user:', otherUser.name);

      // Get unread count for this user
      const unreadCount = (match.unreadCount && match.unreadCount.get) ? 
        match.unreadCount.get(userId.toString()) || 0 : 0;

      return {
        _id: match._id,
        userId: otherUser._id,
        status: match.status,
        isBookmarked: match.isBookmarked || false,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        matchedAt: match.matchedAt,
        unreadCount,
        lastMessage: match.lastMessage ? {
          _id: match.lastMessage._id,
          text: match.lastMessage.text,
          senderId: match.lastMessage.sender,
          createdAt: match.lastMessage.createdAt,
          read: match.lastMessage.read
        } : null,
        displayUser: {
          _id: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar || null,
          bio: otherUser.bio || '',
          location: otherUser.location || '',
          jobRole: otherUser.jobRole || '',
          skills: otherUser.skills || []
        }
      };
    }).filter(match => match !== null); // Remove any null matches

    console.log('Returning matches:', matchesWithDetails.length);
    res.json(matchesWithDetails);
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
      users: userId
    })
    .populate('users', '-password -github -google');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const otherUser = match.users.find(u => u._id.toString() !== userId.toString());

    // Get last message if available
    let lastMessage = null;
    if (match.lastMessage) {
      lastMessage = await Message.findById(match.lastMessage);
    }

    // Get unread count for this user
    const unreadCount = (match.unreadCount && match.unreadCount.get) ? 
      match.unreadCount.get(userId.toString()) || 0 : 0;

    res.json({
      _id: match._id,
      userId: otherUser._id,
      status: match.status,
      isBookmarked: match.isBookmarked || false,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      matchedAt: match.matchedAt,
      unreadCount,
      lastMessage: lastMessage ? {
        _id: lastMessage._id,
        text: lastMessage.text,
        senderId: lastMessage.sender,
        createdAt: lastMessage.createdAt,
        read: lastMessage.read
      } : null,
      displayUser: {
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
    
    console.log('Like request:', {
      from: currentUserId,
      to: targetUserId
    });

    // Get user names for logging
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    console.log(`${currentUser.name} is trying to match with ${targetUser.name}`);

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot like yourself' });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's already a match between these users
    const existingMatch = await Match.findMatch(currentUserId, targetUserId);

    if (existingMatch) {
      console.log('Found existing match:', {
        id: existingMatch._id,
        status: existingMatch.status,
        users: existingMatch.users
      });

      // If there's already any interaction (pending, matched, or rejected), don't create a new one
      if (existingMatch.status === 'pending') {
        // Check if this is a mutual like (the target user has already liked the current user)
        const targetUserInitiated = existingMatch.users[0].toString() === targetUserId;
        
        if (targetUserInitiated) {
          console.log('Mutual like detected - creating match!');
          // It's a match! Update the existing match
          existingMatch.status = 'matched';
          existingMatch.matchedAt = new Date();
          await existingMatch.save();
          
          // Populate user details
          await existingMatch.populate('users', '-password -github -google');
          
          // Create a conversation for the matched users
          let conversation = await Conversation.findConversation(currentUserId, targetUserId);
          if (!conversation) {
            conversation = new Conversation({
              members: [currentUserId, targetUserId]
            });
            await conversation.save();
          }
          
          // Add match to both users' matches arrays
          await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { matches: existingMatch._id }
          });
          await User.findByIdAndUpdate(targetUserId, {
            $addToSet: { matches: existingMatch._id }
          });
          
          // Get the other user's details
          const otherUser = existingMatch.users.find(u => u._id.toString() !== currentUserId.toString());
          
          // Emit real-time match notification to both users
          const io = req.app.get('io');
          if (io) {
            // Get full user profiles for socket emission
            const currentUserProfile = {
              _id: currentUser._id,
              name: currentUser.name,
              avatar: currentUser.avatar,
              bio: currentUser.bio,
              location: currentUser.location,
              jobRole: currentUser.jobRole,
              skills: currentUser.skills
            };

            const otherUserProfile = {
              _id: otherUser._id,
              name: otherUser.name,
              avatar: otherUser.avatar,
              bio: otherUser.bio,
              location: otherUser.location,
              jobRole: otherUser.jobRole,
              skills: otherUser.skills
            };
            
            // Emit to current user
            io.to(currentUserId.toString()).emit('matchCreated', {
              matchId: existingMatch._id,
              user: otherUserProfile,
              message: `You matched with ${otherUser.name}!`
            });
            
            // Emit to other user
            io.to(targetUserId).emit('matchCreated', {
              matchId: existingMatch._id,
              user: currentUserProfile,
              message: `You matched with ${currentUser.name}!`
            });
          }

          return res.json({
            message: 'It\'s a match!',
            isMatch: true,
            match: {
              _id: existingMatch._id,
              users: existingMatch.users,
              status: existingMatch.status,
              matchedAt: existingMatch.matchedAt
            }
          });
        }
      }
      
      // If there's already any interaction, don't allow another one
      console.log('User has already interacted with this person');
      return res.status(400).json({ 
        message: 'You have already interacted with this user',
        existingStatus: existingMatch.status
      });
    }

    // Check if current user has already liked this target user (to prevent duplicates)
    const currentUserData = await User.findById(currentUserId);
    if (currentUserData.likes && currentUserData.likes.includes(targetUserId)) {
      console.log('User has already liked this person');
      return res.json({
        message: 'Like already sent!',
        isMatch: false
      });
    }

    // Create a new pending match
    console.log('Creating new pending match...');
    
    // Add the like to the current user's likes array first
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { likes: targetUserId }
    });

    // Try to create the match, but handle duplicates gracefully
    try {
      const newMatch = new Match({
        users: [currentUserId, targetUserId],
        status: 'pending'
      });

      await newMatch.save();
      console.log('New pending match created successfully:', newMatch._id);
      
      res.json({
        message: 'Like sent!',
        isMatch: false
      });
    } catch (saveError) {
      console.log('Error saving match (likely duplicate):', saveError.message);
      
      // Always return success to the user - the like was registered
      res.json({
        message: 'Like sent!',
        isMatch: false
      });
    }
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

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot dislike yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's already a match between these users
    const existingMatch = await Match.findMatch(currentUserId, targetUserId);

    if (existingMatch) {
      if (existingMatch.users.some(id => id.toString() === currentUserId.toString())) {
        return res.status(400).json({ message: 'You have already interacted with this user' });
      }
      
      if (existingMatch.status === 'pending') {
        existingMatch.status = 'rejected';
        await existingMatch.save();
        
        return res.json({
          message: 'User disliked successfully'
        });
      }
      
      return res.status(400).json({ message: 'You have already interacted with this user' });
    }

    // Add the dislike to the current user's dislikes array
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { dislikes: targetUserId }
    });

    // Create a new rejected match
    const newMatch = new Match({
      users: [currentUserId, targetUserId],
      status: 'rejected'
    });

    await newMatch.save();
    res.json({ message: 'User disliked successfully' });
  } catch (error) {
    console.error('Error disliking user:', error);
    res.status(500).json({ message: 'Error processing dislike' });
  }
};

// PUT /matches/:matchId/bookmark - Toggle bookmark status for a match
const toggleBookmark = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    const match = await Match.findOne({
      _id: matchId,
      users: userId
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Toggle bookmark status
    match.isBookmarked = !match.isBookmarked;
    match.updatedAt = new Date();
    await match.save();

    res.json({
      message: match.isBookmarked ? 'Match bookmarked' : 'Bookmark removed',
      isBookmarked: match.isBookmarked
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Error toggling bookmark' });
  }
};

// GET /matches/potential - Get potential matches for the user
const getPotentialMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Use aggregation pipeline for better performance
    const potentialMatches = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'matches',
          let: { currentUserId: userId, targetUserId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$currentUserId', '$users'] },
                    { $in: ['$$targetUserId', '$users'] }
                  ]
                }
              }
            }
          ],
          as: 'existingMatch'
        }
      },
      {
        $match: {
          existingMatch: { $size: 0 }
        }
      },
      {
        $project: {
          name: 1,
          avatar: 1,
          bio: 1,
          location: 1,
          jobRole: 1,
          skills: 1
        }
      },
      {
        $limit: 20
      }
    ]);

    res.json(potentialMatches);
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    res.status(500).json({ message: 'Error fetching potential matches' });
  }
};

module.exports = {
  getMyMatches,
  getMatchDetails,
  likeUser,
  dislikeUser,
  getPotentialMatches,
  toggleBookmark
};