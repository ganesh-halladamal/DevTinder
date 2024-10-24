const express = require("express");

const app = express();

app.use("/ganesh", (req,res)=>{
  res.send("Hello from ganesh's server..!");
});

app.use("/dashboard", (req,res)=>{
  res.send("Hello from dashboard..!");
});

app.listen(3001, () => {
  console.log("Server is successfully listening on port 3001...");
});
