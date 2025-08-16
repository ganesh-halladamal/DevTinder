const { validationResult } = require('express-validator');
const Message = require('../models/message');
const Match = require('../models/match');
const Conversation = require('../models/conversation');
const User = require('../models/user');

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    // Get messages with pagination
    const messages = await Message.find({ conversationId })
      .sort('createdAt') // Changed from -createdAt to show oldest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    // Get total count for pagination
    const total = await Message.countDocuments({ conversationId });

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

    const { conversationId } = req.params;
    const { text, attachments } = req.body;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    // Get the recipient
    const recipientId = conversation.members.find(id => id.toString() !== req.user._id.toString());

    // Create message
    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: recipientId,
      text,
      attachments: attachments || []
    });

    // Update conversation's last message and unread count
    conversation.lastMessage = message._id;
    conversation.lastUpdated = new Date();
    await conversation.updateUnreadCount(recipientId, 1);

    // Update recipient's unread message count
    await User.findByIdAndUpdate(recipientId, {
      $inc: { unreadMessages: 1 }
    });

    // Get the match associated with this conversation
    const match = await Match.findOne({
      users: { $all: [req.user._id, recipientId], $size: 2 },
      status: 'matched'
    });

    if (match) {
      // Update match's last message and unread count
      match.lastMessage = message._id;
      await match.updateUnreadCount(recipientId, 1);
    }

    // Populate sender details
    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    // Emit real-time message via socket.io
    const io = req.app.get('io');
    if (io) {
      const messageDetails = {
        _id: message._id,
        conversationId: message.conversationId,
        sender: {
          _id: message.sender._id,
          name: message.sender.name,
          avatar: message.sender.avatar || '/default-avatar.png'
        },
        receiver: {
          _id: message.receiver._id,
          name: message.receiver.name,
          avatar: message.receiver.avatar || '/default-avatar.png'
        },
        text: message.text,
        attachments: message.attachments,
        createdAt: message.createdAt,
        status: message.status,
        read: message.read
      };
      
      // Emit to both sender and recipient in the conversation room
      io.to(`conversation_${conversationId}`).emit('receiveMessage', messageDetails);

      // Also emit to recipient's personal room for notification
      io.to(recipientId.toString()).emit('newMessage', {
        message: messageDetails,
        conversationId
      });
    }

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
    const { conversationId } = req.params;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date(),
        status: 'read'
      }
    );

    // Reset unread counts
    await conversation.markAsRead(req.user._id);
    await User.findByIdAndUpdate(req.user._id, {
      $set: { unreadMessages: 0 }
    });

    // Get the match associated with this conversation
    const match = await Match.findOne({
      users: { $all: conversation.members, $size: 2 },
      status: 'matched'
    });

    if (match) {
      // Reset match unread count for this user
      match.unreadCount.set(req.user._id.toString(), 0);
      await match.save();
    }

    // Emit real-time read receipt via socket.io
    const io = req.app.get('io');
    if (io) {
      const otherUserId = conversation.members.find(id => id.toString() !== req.user._id.toString());
      io.to(otherUserId.toString()).emit('messages_read', {
        conversationId,
        by: req.user._id
      });
    }

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
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({
        message: 'Message not found or unauthorized'
      });
    }

    await message.remove();

    // Update conversation's last message if needed
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation && conversation.lastMessage.toString() === messageId) {
      const lastMessage = await Message.findOne({ conversationId: conversation._id })
        .sort('-createdAt');
      
      conversation.lastMessage = lastMessage ? lastMessage._id : null;
      conversation.lastUpdated = new Date();
      await conversation.save();
    }

    // Update match's last message if needed
    const match = await Match.findOne({
      users: { $all: conversation.members, $size: 2 },
      status: 'matched'
    });

    if (match && match.lastMessage.toString() === messageId) {
      const lastMessage = await Message.findOne({ conversationId: conversation._id })
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

// Get conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all conversations for the user with details
    const conversations = await Conversation.getUserConversationsWithDetails(userId);
    
    // Get total unread message count for the user
    const totalUnreadCount = await Message.getUnreadCount(userId);
    
    res.json({
      conversations,
      totalUnreadCount
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      message: 'Error fetching conversations'
    });
  }
};

// Get or create conversation between two users
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if users are matched
    const match = await Match.findOne({
      users: { $all: [currentUserId, userId], $size: 2 },
      status: 'matched'
    });

    if (!match) {
      return res.status(403).json({ message: 'You can only chat with matched users' });
    }

    // Find existing conversation
    let conversation = await Conversation.findConversation(currentUserId, userId);

    // If no conversation exists, create one
    if (!conversation) {
      conversation = new Conversation({
        members: [currentUserId, userId]
      });
      await conversation.save();
    }

    // Populate members
    await conversation.populate('members', '-password -github -google');
    
    // Populate last message if exists
    if (conversation.lastMessage) {
      await conversation.populate('lastMessage');
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({
      message: 'Error getting or creating conversation'
    });
  }
};

// Get message preview for a conversation
exports.getMessagePreview = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 3 } = req.query;
    
    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    // Get message preview
    const preview = await Message.getMessagePreview(conversationId, parseInt(limit));
    
    // Get unread count for this conversation
    const unreadCount = await Message.countDocuments({
      conversationId,
      receiver: req.user._id,
      read: false
    });

    res.json({
      preview,
      unreadCount
    });
  } catch (error) {
    console.error('Get message preview error:', error);
    res.status(500).json({
      message: 'Error fetching message preview'
    });
  }
};

// Get unread message counts for all conversations
exports.getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get unread counts per conversation
    const unreadCounts = await Message.getUnreadCountPerConversation(userId);
    
    // Get total unread count
    const totalUnread = await Message.getUnreadCount(userId);
    
    res.json({
      unreadCounts,
      totalUnread
    });
  } catch (error) {
    console.error('Get unread counts error:', error);
    res.status(500).json({
      message: 'Error fetching unread counts'
    });
  }
};