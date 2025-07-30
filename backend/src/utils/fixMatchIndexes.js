const mongoose = require('mongoose');
const Match = require('../models/match');

async function fixMatchIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = 'mongodb+srv://codebotnetgh:AMtfmJYPjAokomd9@devtinder.xrgga09.mongodb.net/';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Drop the existing unique index on users field
    try {
      await Match.collection.dropIndex('users_1');
      console.log('Dropped old users_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index users_1 does not exist, skipping drop');
      } else {
        console.error('Error dropping index:', error.message);
      }
    }

    // Create a compound unique index to prevent duplicate matches
    // This ensures matches between the same pair of users are unique
    await Match.collection.createIndex(
      { users: 1 }, 
      { 
        unique: true, 
        name: 'unique_match_between_users' 
      }
    );
    console.log('Created new unique compound index');

    // Verify indexes
    const indexes = await Match.collection.indexes();
    console.log('Current indexes:', indexes);

    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixMatchIndexes();