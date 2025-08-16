const User = require('../models/user');
const Match = require('../models/match');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

const createDatabaseIndexes = async () => {
  try {
    console.log('Creating database indexes for optimal performance...');

    // User indexes
    try {
      await User.createIndexes();
      console.log('✅ User indexes created');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  User indexes already exist, skipping...');
      } else {
        console.log('⚠️  User index error:', error.message);
      }
    }

    // Match indexes
    try {
      await Match.createIndexes();
      console.log('✅ Match indexes created');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  Match indexes already exist, skipping...');
      } else {
        console.log('⚠️  Match index error:', error.message);
      }
    }

    // Message indexes
    try {
      await Message.createIndexes();
      console.log('✅ Message indexes created');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  Message indexes already exist, skipping...');
      } else {
        console.log('⚠️  Message index error:', error.message);
      }
    }

    // Conversation indexes
    try {
      await Conversation.createIndexes();
      console.log('✅ Conversation indexes created');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  Conversation indexes already exist, skipping...');
      } else {
        console.log('⚠️  Conversation index error:', error.message);
      }
    }

    console.log('🎉 Database indexes setup completed');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};

module.exports = { createDatabaseIndexes };
