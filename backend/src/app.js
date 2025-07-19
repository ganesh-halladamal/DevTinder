const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    // Creating a new instance of the User model
    const user = new User({
      firstName: "Ganesh",
      lastName: "Halladamal",
      emailId: "example@gmail.com", // Fix the typo in "gmail"
      password: "Ganesh@123",
    });

    // Save the user to the database
    await user.save();

    res.status(201).send("User added successfully!");
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).send("An error occurred while adding the user.");
  }
});

// Connect to the database and start the server
connectDB()
  .then(() => {
    console.log("Database connection established...");
    app.listen(3001, () => {
      console.log("Server is successfully listening on port 3001...");
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
