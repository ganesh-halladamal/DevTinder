const Match = require('../models/match');
const User = require('../models/user');

const createMatch = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2 || userId1 === userId2) {
      return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    const sortedUsers = [userId1, userId2].sort();

    const existingMatch = await Match.findOne({
      users: { $all: sortedUsers, $size: 2 }
    });

    if (existingMatch) {
      return res.status(200).json(existingMatch);
    }

    const match = new Match({
      users: sortedUsers
    });

    await match.save();
    res.status(201).json(match);
  } catch (error) {
    if (error.code === 11000) {
      const existingMatch = await Match.findOne({
        users: { $all: [req.body.userId1, req.body.userId2].sort(), $size: 2 }
      });
      res.status(200).json(existingMatch);
    } else {
      console.error('Error creating match:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

const swipeUser = async (req, res) => {
  try {
    const { targetUserId, action } = req.body;
    const currentUserId = req.user._id;

    if (!targetUserId || !action) {
      return res.status(400).json({ message: 'Target user ID and action are required' });
    }

    if (action === 'like') {
      // Check if the target user has already liked current user
      const reverseLike = await Match.findOne({
        users: { $all: [targetUserId, currentUserId], $size: 2 }
      });

      if (reverseLike) {
        // It's a match!
        return res.status(201).json({ 
          message: 'It\'s a match!', 
          match: reverseLike 
        });
      }

      // Create a pending like
      const newMatch = new Match({
        users: [currentUserId, targetUserId].sort(),
        status: 'pending'
      });

      await newMatch.save();
      return res.status(201).json({ message: 'Like sent successfully' });
    }

    if (action === 'skip') {
      // Record skip action (optional - could store in a separate collection)
      return res.status(200).json({ message: 'User skipped' });
    }

    res.status(400).json({ message: 'Invalid action' });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const matches = await Match.find({
      users: userId,
      status: 'active'
    }).populate('users', 'name avatar bio jobRole location').sort({ createdAt: -1 });
    
    // Format matches for frontend
    const formattedMatches = matches.map(match => {
      const otherUser = match.users.find(u => u._id.toString() !== userId.toString());
      return {
        _id: match._id,
        displayUser: {
          _id: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          bio: otherUser.bio,
          jobRole: otherUser.jobRole,
          location: otherUser.location
        },
        matchScore: match.matchScore || 0,
        isBookmarked: match.isBookmarked || false,
        matchedAt: match.createdAt
      };
    });
    
    res.json({ matches: formattedMatches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMatch,
  swipeUser,
  getMatches
};