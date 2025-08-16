const mongoose = require('mongoose');
const Match = require('../models/match');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devtinder';

const fixMatchStatus = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all matches with 'active' status
    const activeMatches = await Match.find({ status: 'active' });
    console.log(`Found ${activeMatches.length} matches with 'active' status`);

    if (activeMatches.length > 0) {
      // Update all active matches to matched status
      const updateResult = await Match.updateMany(
        { status: 'active' },
        { $set: { status: 'matched' } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} matches from 'active' to 'matched' status`);
    } else {
      console.log('No matches with "active" status found');
    }

    // Verify the update
    const remainingActiveMatches = await Match.find({ status: 'active' });
    const matchedMatches = await Match.find({ status: 'matched' });
    
    console.log(`Verification: ${remainingActiveMatches.length} matches still have 'active' status`);
    console.log(`Verification: ${matchedMatches.length} matches now have 'matched' status`);

    process.exit(0);
  } catch (error) {
    console.error('Error fixing match status:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  fixMatchStatus();
}

module.exports = fixMatchStatus;