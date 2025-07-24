const User = require('../models/user');
const Match = require('../models/match');

/**
 * Utility function to seed matches between users in the database
 * This can be used to create test matches for development
 */

const seedMatches = async () => {
  try {
    console.log('Starting to seed matches...');
    
    // Get all users from database
    const users = await User.find({}).select('_id name interests skills');
    
    if (users.length < 2) {
      console.log('Not enough users to create matches');
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    // Get all existing matches
    const existingMatches = await Match.find({});
    console.log(`Found ${existingMatches.length} existing matches`);
    
    // Create matches between users
    const matches = [];
    
    // Create matches between each user and at least 2 others
    for (let i = 0; i < users.length; i++) {
      const user1 = users[i];
      
      // Each user should have at least 2 matches (if there are enough users)
      const matchCount = Math.min(2, users.length - 1);
      let matchesCreated = 0;
      
      for (let j = 0; j < users.length && matchesCreated < matchCount; j++) {
        if (i === j) continue; // Skip self
        
        const user2 = users[j];
        
        // Check if match already exists in any direction
        const matchExists = existingMatches.some(match => {
          const matchUsers = match.users.map(u => u.toString());
          return (
            (matchUsers.includes(user1._id.toString()) && matchUsers.includes(user2._id.toString())) ||
            (matchUsers.includes(user2._id.toString()) && matchUsers.includes(user1._id.toString()))
          );
        });
        
        // Also check if we've already created this match in our current batch
        const alreadyCreatedInBatch = matches.some(match => {
          const matchUsers = match.users.map(u => u.toString());
          return (
            (matchUsers.includes(user1._id.toString()) && matchUsers.includes(user2._id.toString())) ||
            (matchUsers.includes(user2._id.toString()) && matchUsers.includes(user1._id.toString()))
          );
        });
        
        if (!matchExists && !alreadyCreatedInBatch) {
          // Calculate common interests
          const commonInterests = user1.interests?.filter(interest => 
            user2.interests?.includes(interest)
          ) || [];
          
          // Calculate common skills
          const user1Skills = user1.skills?.map(s => s.name) || [];
          const user2Skills = user2.skills?.map(s => s.name) || [];
          const commonSkills = user1Skills.filter(skill => user2Skills.includes(skill));
          
          // Calculate match score based on common interests and skills
          const matchScore = Math.min(
            ((commonInterests.length * 5) + (commonSkills.length * 5)), 
            100
          );
          
          // Create match object
          const match = new Match({
            users: [user1._id, user2._id],
            matchScore,
            commonInterests,
            commonSkills,
            status: 'active',
            matchedAt: new Date()
          });
          
          matches.push(match);
          matchesCreated++;
          console.log(`Created match between ${user1.name} and ${user2.name}`);
        }
      }
    }
    
    if (matches.length > 0) {
      // Save matches one by one to avoid duplicate key issues
      for (const match of matches) {
        try {
          await match.save();
          
          // Update users' matches array
          const [userId1, userId2] = match.users;
          
          await User.updateOne(
            { _id: userId1 },
            { $addToSet: { matches: userId2 } }
          );
          
          await User.updateOne(
            { _id: userId2 },
            { $addToSet: { matches: userId1 } }
          );
        } catch (error) {
          if (error.code === 11000) {
            console.warn(`Skipping duplicate match: ${error.message}`);
          } else {
            throw error;
          }
        }
      }
      
      console.log(`Successfully processed ${matches.length} matches!`);
    } else {
      console.log('No new matches created');
    }
    
    return matches;
  } catch (error) {
    console.error('Error seeding matches:', error);
    throw error;
  }
};

module.exports = { seedMatches }; 