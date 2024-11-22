const mongoose = require('mongoose');

// Define the schema for a user
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true, // Makes this field mandatory
    trim: true, // Removes whitespace around the string
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  emailId: {
    type: String,
    required: true,
    unique: true, // Ensures email addresses are unique
    trim: true,
    lowercase: true, // Converts to lowercase
    match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'], // Regex for email validation
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically sets the date of creation
  },
});

// Create the model from the schema

// Export the model to use it elsewhere
module.exports = mongoose.model("User", userSchema);
