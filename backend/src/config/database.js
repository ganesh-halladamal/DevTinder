const mongoose = require("mongoose");
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    // Try using MongoDB Atlas first
    try {
      const uri = process.env.MONGODB_URI || 'mongodb+srv://codebotnetgh:AMtfmJYPjAokomd9@devtinder.xrgga09.mongodb.net/';
      console.log("Connecting to MongoDB Atlas:", uri);
      
      await mongoose.connect(uri);
      console.log('Connected to MongoDB Atlas successfully');
      
      // Check database stats without seeding
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`Database contains ${userCount} users.`);
      
      return;
    } catch (atlasError) {
      console.error('MongoDB Atlas connection error:', atlasError);
      // If MongoDB Atlas fails, fall back to memory server
      console.log('Falling back to MongoDB Memory Server...');
    }
    
    // Only try in-memory MongoDB if Atlas fails
    console.log('Attempting to use MongoDB Memory Server...');
    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    console.log(`MongoDB Memory Server started at ${memoryUri}`);
    await mongoose.connect(memoryUri);
    console.log('Connected to MongoDB Memory Server');
    
    // Check database stats without seeding
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`Database contains ${userCount} users.`);
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Could not connect to any MongoDB instance. Exiting...');
    process.exit(1);
  }
};

module.exports = connectDB;
