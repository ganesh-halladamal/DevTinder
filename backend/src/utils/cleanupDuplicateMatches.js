const mongoose = require('mongoose');
const Match = require('../models/match');

async function cleanupDuplicateMatches() {
  try {
    // Connect to MongoDB
    const mongoUri = 'mongodb+srv://codebotnetgh:AMtfmJYPjAokomd9@devtinder.xrgga09.mongodb.net/';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find and remove duplicate matches
    const duplicates = await Match.aggregate([
      {
        $group: {
          _id: {
            users: { $sortArray: { input: "$users", sortBy: 1 } }
          },
          count: { $sum: 1 },
          ids: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`Found ${duplicates.length} groups of duplicate matches`);

    for (const group of duplicates) {
      // Keep the first match, remove the rest
      const [keepId, ...removeIds] = group.ids;
      console.log(`Keeping match ${keepId}, removing ${removeIds.length} duplicates`);
      
      await Match.deleteMany({ _id: { $in: removeIds } });
    }

    console.log('Cleanup completed');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    process.exit(1);
  }
}

cleanupDuplicateMatches();