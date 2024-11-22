const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect("mongodb+srv://7022815741:Ganesh%402001@ganeshnode.5rhbg.mongodb.net/devTinder"
  );
};

module.exports = connectDB;

