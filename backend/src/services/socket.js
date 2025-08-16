const jwt = require('jsonwebtoken');
const Message = require('../models/message');
const Match = require('../models/match');
const Conversation = require('../models/conversation');
const User = require('../models/user');

// Store active user connections
const activeUsers = new Map();

const setupSocketHandlers = (io) => {
  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Store user's socket connection
    activeUsers.set(socket.userId, socket.id);

    // Join user's room for private messages
    socket.join(socket.userId);

    // Handle conversation joining
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify the conversation exists and user is part of it
        const conversation = await Conversation.findOne({
          _id: conversationId,
          members: socket.userId
        });

        if (conversation) {
          socket.join(`conversation_${conversationId}`);
          console.log(`User ${socket.userId} joined conversation room: conversation_${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Handle private messaging
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, text, attachments } = data;

        // Verify the conversation exists and user is part of it
        const conversation = await Conversation.findOne({
          _id: conversationId,
          members: socket.userId
        });

        if (!conversation) {
          throw new Error('Invalid conversation');
        }

        // Get the recipient
        const recipientId = conversation.members.find(id => id.toString() !== socket.userId.toString());

        // Create and save the message
        const message = await Message.create({
          conversationId,
          sender: socket.userId,
          receiver: recipientId,
          text,
          attachments: attachments || []
        });

        // Populate sender details
        await message.populate('sender', 'name avatar');

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
          users: { $all: [socket.userId, recipientId], $size: 2 },
          status: 'matched'
        });

        if (match) {
          // Update match's last message and unread count
          match.lastMessage = message._id;
          await match.updateUnreadCount(recipientId, 1);
        }

        // Emit the message to both users
        const messageDetails = {
          _id: message._id,
          conversationId: message.conversationId,
          sender: {
            _id: message.sender._id,
            name: message.sender.name,
            avatar: message.sender.avatar || '/default-avatar.png'
          },
          receiver: recipientId,
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

      } catch (error) {
        console.error('Message error:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    socket.on('typing_stop', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    // Handle read receipts
    socket.on('mark_messages_read', async (conversationId) => {
      try {
        // Verify the conversation exists and user is part of it
        const conversation = await Conversation.findOne({
          _id: conversationId,
          members: socket.userId
        });

        if (!conversation) return;

        // Mark all unread messages as read
        await Message.updateMany(
          {
            conversationId,
            receiver: socket.userId,
            read: false
          },
          {
            read: true,
            readAt: new Date(),
            status: 'read'
          }
        );

        // Reset unread counts
        await conversation.markAsRead(socket.userId);
        await User.findByIdAndUpdate(socket.userId, {
          $set: { unreadMessages: 0 }
        });

        // Get the match associated with this conversation
        const match = await Match.findOne({
          users: { $all: conversation.members, $size: 2 },
          status: 'matched'
        });

        if (match) {
          // Reset match unread count for this user
          match.unreadCount.set(socket.userId.toString(), 0);
          await match.save();
        }

        // Notify the other user that messages were read
        const otherUserId = conversation.members.find(id => id.toString() !== socket.userId.toString());
        io.to(otherUserId.toString()).emit('messages_read', {
          conversationId,
          by: socket.userId
        });

      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Handle match notifications (emitted from controller)
    socket.on('match_created', async (matchData) => {
      try {
        const { matchId, userId, otherUser } = matchData;
        
        // Emit to the user who just got matched
        io.to(userId.toString()).emit('matchCreated', {
          matchId,
          user: otherUser,
          message: `You matched with ${otherUser.name}!`
        });

      } catch (error) {
        console.error('Match notification error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      activeUsers.delete(socket.userId);
    });
  });
};

module.exports = {
  setupSocketHandlers
};