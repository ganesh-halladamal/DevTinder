const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use the provided MongoDB Atlas connection string
    const uri = process.env.MONGODB_URI || "mongodb+srv://codebotnetgh:AMtfmJYPjAokomd9@devtinder.xrgga09.mongodb.net/devtinder";
    console.log("MongoDB URI:", uri);
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Fallback to memory server if available
    if (process.env.MEMORY_SERVER_URI) {
      try {
        console.log('Attempting to connect to memory server...');
        await mongoose.connect(process.env.MEMORY_SERVER_URI);
        console.log('Connected to memory server MongoDB');
        return;
      } catch (localError) {
        console.error('Memory server connection error:', localError);
      }
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
