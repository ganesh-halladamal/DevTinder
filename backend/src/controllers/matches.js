const Match = require('../models/match');
const User = require('../models/user');

// Get user's matches
exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.user.id,
      status: 'active'
    })
    .populate('users', '-password -github -google')
    .populate('lastMessage')
    .sort('-updatedAt');

    res.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      message: 'Error fetching matches'
    });
  }
};

// Create a new match
exports.createMatch = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Check if match already exists
    const existingMatch = await Match.findOne({
      users: { $all: [req.user.id, userId] }
    });

    if (existingMatch) {
      return res.status(400).json({
        message: 'Match already exists'
      });
    }

    // Get both users
    const [user1, user2] = await Promise.all([
      User.findById(req.user.id),
      User.findById(userId)
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Calculate common interests and skills
    const commonInterests = user1.interests.filter(interest => 
      user2.interests.includes(interest)
    );

    const commonSkills = user1.skills
      .map(skill => skill.name)
      .filter(skillName => 
        user2.skills.some(s => s.name === skillName)
      );

    // Calculate match score based on common interests and skills
    const matchScore = Math.min(
      ((commonInterests.length * 5) + (commonSkills.length * 5)), 
      100
    );

    // Create new match
    const match = await Match.create({
      users: [req.user.id, userId],
      matchScore,
      commonInterests,
      commonSkills
    });

    // Add match to both users' matches array
    user1.matches.push(userId);
    user2.matches.push(req.user.id);
    await Promise.all([user1.save(), user2.save()]);

    // Populate match details
    await match.populate('users', '-password -github -google');

    res.status(201).json({ match });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({
      message: 'Error creating match'
    });
  }
};

// Archive/Block a match
exports.updateMatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'archived', 'blocked'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status'
      });
    }

    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user.id
    });

    if (!match) {
      return res.status(404).json({
        message: 'Match not found'
      });
    }

    match.status = status;
    await match.save();

    res.json({ match });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({
      message: 'Error updating match status'
    });
  }
};

// Get match details
exports.getMatchDetails = async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user.id
    })
    .populate('users', '-password -github -google')
    .populate('lastMessage');

    if (!match) {
      return res.status(404).json({
        message: 'Match not found'
      });
    }

    res.json({ match });
  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({
      message: 'Error fetching match details'
    });
  }
}; 