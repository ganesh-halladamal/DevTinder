const jwt = require('jsonwebtoken');
const Message = require('../models/message');
const Match = require('../models/match');

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

    // Handle private messaging
    socket.on('private_message', async (data) => {
      try {
        const { matchId, content, attachments } = data;

        // Verify the match exists and user is part of it
        const match = await Match.findOne({
          _id: matchId,
          users: socket.userId,
          status: 'active'
        });

        if (!match) {
          throw new Error('Invalid match');
        }

        // Create and save the message
        const message = await Message.create({
          match: matchId,
          sender: socket.userId,
          content,
          attachments: attachments || []
        });

        // Update match's last message
        await Match.findByIdAndUpdate(matchId, {
          lastMessage: message._id
        });

        // Get the other user in the match
        const recipientId = match.users.find(id => id.toString() !== socket.userId.toString());
        
        // Emit the message to both users
        const messageDetails = message.getMessageDetails();
        socket.emit('message_sent', messageDetails);
        
        if (activeUsers.has(recipientId)) {
          io.to(activeUsers.get(recipientId)).emit('message_received', messageDetails);
        }

      } catch (error) {
        console.error('Message error:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (matchId) => {
      socket.to(matchId).emit('user_typing', { userId: socket.userId });
    });

    socket.on('typing_stop', (matchId) => {
      socket.to(matchId).emit('user_stop_typing', { userId: socket.userId });
    });

    // Handle read receipts
    socket.on('mark_read', async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        if (message) {
          await message.markAsRead(socket.userId);
          
          // Notify the sender that the message was read
          if (activeUsers.has(message.sender.toString())) {
            io.to(activeUsers.get(message.sender.toString())).emit('message_read', {
              messageId,
              readBy: socket.userId
            });
          }
        }
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    // Handle match notifications
    socket.on('new_match', async (matchData) => {
      try {
        const { matchId } = matchData;
        const match = await Match.findById(matchId)
          .populate('users', '-password -github -google');

        if (!match) return;

        // Emit to both users in the match
        match.users.forEach(user => {
          if (activeUsers.has(user._id.toString())) {
            io.to(activeUsers.get(user._id.toString())).emit('new_match', {
              matchId: match._id,
              users: match.users.filter(u => u._id.toString() !== user._id.toString()),
              matchScore: match.matchScore,
              commonInterests: match.commonInterests,
              commonSkills: match.commonSkills
            });
          }
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