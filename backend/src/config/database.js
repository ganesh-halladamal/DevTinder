const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://codebotnetgh:AMtfmJYPjAokomd9@devtinder.xrgga09.mongodb.net/';
    console.log("MongoDB URI:", uri);
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Fallback to in-memory MongoDB for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Attempting to use MongoDB Memory Server...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        await mongoose.connect(memoryUri);
        console.log('Connected to MongoDB Memory Server:', memoryUri);
        return;
      } catch (memoryError) {
        console.error('Memory server connection error:', memoryError);
      }
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;

