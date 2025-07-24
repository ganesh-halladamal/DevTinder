require('dotenv').config();
const mongoose = require('mongoose');
const { seedMatches } = require('./seedMatches');
const connectDB = require('../config/database');

async function runSeed() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    console.log('Seeding matches...');
    await seedMatches();
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seed function
runSeed(); 