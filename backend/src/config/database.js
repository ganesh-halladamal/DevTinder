const mongoose = require("mongoose");
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createDatabaseIndexes } = require('../utils/createIndexes');

const connectDB = async () => {
  try {
    // Try using MongoDB Atlas first
    try {
      // Updated connection string with database name and options
      const uri = process.env.MONGODB_URI || 'mongodb+srv://codebotnetgh:AMtfmJYPjAokomd9@devtinder.xrgga09.mongodb.net/test?retryWrites=true&w=majority';
      console.log("Connecting to MongoDB Atlas:", uri);
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        dbName: 'test', // Explicitly set the database name
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true
        }
      });
      console.log('Connected to MongoDB Atlas successfully');
      
      // Check database stats without seeding
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      const userCount = await db.collection('users').countDocuments();
      console.log(`Database '${db.databaseName}' contains ${userCount} users.`);
      
      // Create database indexes for performance
      await createDatabaseIndexes();
      
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
    
    // Create database indexes for performance
    await createDatabaseIndexes();
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Could not connect to any MongoDB instance. Exiting...');
    process.exit(1);
  }
};

module.exports = connectDB;
