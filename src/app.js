const express = require("express");

const connectDB = require("./config/database");
const app = express();

connectDB().then(()=>{
  console.log("Database connection established....");
  app.listen(3001, () => {
    console.log("Server is successfully listening on port 3001...");
  }); 
})
.catch(err=>{
  console.error("Database connection failed...");
})
 
