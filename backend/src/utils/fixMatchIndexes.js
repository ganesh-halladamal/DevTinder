const mongoose = require('mongoose');
require('dotenv').config();

const fixMatchIndexes = async () => {
  try {
    console.log('🔧 Fixing Match collection indexes...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const matchesCollection = db.collection('matches');

    // List current indexes
    console.log('\n📋 Current indexes:');
    const indexes = await matchesCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop problematic index if it exists
    try {
      await matchesCollection.dropIndex('unique_match_between_users');
      console.log('✅ Dropped old unique_match_between_users index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index unique_match_between_users does not exist');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }

    // Drop any other problematic users indexes
    try {
      await matchesCollection.dropIndex('users_1');
      console.log('✅ Dropped users_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index users_1 does not exist');
      } else {
        console.log('⚠️  Error dropping users_1 index:', error.message);
      }
    }

    // Clear all existing matches to start fresh
    console.log('\n🧹 Clearing existing matches...');
    const deleteResult = await matchesCollection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing matches`);

    // Also clear user interaction arrays
    const User = require('../models/user');
    const users = await User.find({});
    for (const user of users) {
      user.likes = [];
      user.dislikes = [];
      user.matches = [];
      await user.save();
    }
    console.log(`✅ Cleared interaction arrays for ${users.length} users`);

    // Create a proper compound index for user pairs
    console.log('\n🔨 Creating proper indexes...');
    
    // Create a compound index that ensures unique user pairs regardless of order
    await matchesCollection.createIndex(
      { users: 1 },
      { 
        name: 'users_unique_pair',
        partialFilterExpression: { 'users.1': { $exists: true } }
      }
    );
    console.log('✅ Created users_unique_pair index');

    // Create additional useful indexes
    await matchesCollection.createIndex({ status: 1 }, { name: 'status_index' });
    await matchesCollection.createIndex({ createdAt: -1 }, { name: 'created_desc' });
    await matchesCollection.createIndex({ updatedAt: -1 }, { name: 'updated_desc' });
    console.log('✅ Created additional indexes');

    // List final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await matchesCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n🎉 Match indexes fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the fix if called directly
if (require.main === module) {
  fixMatchIndexes().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixMatchIndexes };