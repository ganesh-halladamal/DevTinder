const { validationResult } = require('express-validator');
const Message = require('../models/message');
const Match = require('../models/match');

// Get messages for a match
exports.getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the match
    const match = await Match.findOne({
      _id: matchId,
      users: req.user.id,
      status: 'active'
    });

    if (!match) {
      return res.status(404).json({
        message: 'Match not found'
      });
    }

    // Get messages with pagination
    const messages = await Message.find({ match: matchId })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'name avatar');

    // Get total count for pagination
    const total = await Message.countDocuments({ match: matchId });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Error fetching messages'
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId } = req.params;
    const { content, attachments } = req.body;

    // Verify user is part of the match
    const match = await Match.findOne({
      _id: matchId,
      users: req.user.id,
      status: 'active'
    });

    if (!match) {
      return res.status(404).json({
        message: 'Match not found'
      });
    }

    // Create message
    const message = await Message.create({
      match: matchId,
      sender: req.user.id,
      content,
      attachments: attachments || []
    });

    // Update match's last message
    match.lastMessage = message._id;
    await match.save();

    // Populate sender details
    await message.populate('sender', 'name avatar');

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Error sending message'
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Verify user is part of the match
    const match = await Match.findOne({
      _id: matchId,
      users: req.user.id,
      status: 'active'
    });

    if (!match) {
      return res.status(404).json({
        message: 'Match not found'
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        match: matchId,
        sender: { $ne: req.user.id },
        'readBy.user': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date()
          }
        },
        $set: { status: 'read' }
      }
    );

    res.json({
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      message: 'Error marking messages as read'
    });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user.id
    });

    if (!message) {
      return res.status(404).json({
        message: 'Message not found or unauthorized'
      });
    }

    await message.remove();

    // Update match's last message if needed
    const match = await Match.findById(message.match);
    if (match && match.lastMessage.toString() === messageId) {
      const lastMessage = await Message.findOne({ match: match._id })
        .sort('-createdAt');
      
      match.lastMessage = lastMessage ? lastMessage._id : null;
      await match.save();
    }

    res.json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      message: 'Error deleting message'
    });
  }
}; 