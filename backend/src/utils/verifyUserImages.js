require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

const verifyUserImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devtinder');
    console.log('Connected to MongoDB');

    const users = await User.find({ avatar: { $exists: true } }).select('name avatar');
    console.log('\nUsers with avatars:');
    users.forEach(user => {
      console.log(`- ${user.name}: ${user.avatar}`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyUserImages();
