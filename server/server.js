const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

const app = express();
let orgni = "";

let count = 0;

// List of allowed origins
const allowedOrigins = [
  "http://localhost:5500",
  "122.160.87.56",
  "http://localhost:3490",
  "http://localhost:5173",
];

// CORS options to allow multiple origins
const corsOptions = {
  origin: function (origin, callback) {
    orgni = origin;
    // If no origin is provided (e.g., for non-browser clients), allow it
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// Use CORS with the specified options
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const usersFilePath = path.join(__dirname, "Users.json");

// Helper function to read the Users.json file
const readUsersFromFile = () => {
  const usersData = fs.readFileSync(usersFilePath);
  return JSON.parse(usersData);
};

// Helper function to read the Users.json file
const readUserFromFile = (email) => {
  const usersData = fs.readFileSync(usersFilePath);
  const user = usersData.find((user) => user.email === email);

  if (user) {
    return JSON.parse(user);
  } else {
    return [];
  }
};

// Helper function to write data to the Users.json file
const writeUsersToFile = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};                                

// Get all users
app.get("/users", (req, res) => {
  const users = readUsersFromFile();
  res.json(users);
});

app.get("/login", (req, res) => {
  count++;
  res.cookie("first cookie", "value is random" + count,{httpOnly: true, sameSite:false});
  res.send(orgni);
});

// Get specific user
app.get("/users/:email", (req, res) => {
  const email = req.params.email;
  const users = readUsersFromFile(email);
  const user = users.find((user) => user.email === req.params.email);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Create a new user
app.post("/users", (req, res) => {
  const users = readUsersFromFile();
  const newUser = req.body;

  // Add basic validation
  if (!newUser.name || !newUser.email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  // Add new user to the list
  users.push(newUser);
  writeUsersToFile(users);

  res.status(201).json(newUser);
});

// Delete a user by email
app.delete("/users/:email", (req, res) => {
  const users = readUsersFromFile();
  const email = req.params.email;

  const filteredUsers = users.filter((user) => user.email !== email);

  if (users.length === filteredUsers.length) {
    return res.status(404).json({ error: "User not found" });
  }

  writeUsersToFile(filteredUsers);

  res.status(200).json({ message: "User deleted successfully" });
});

app.get("/init-register", (req, res) => {
  console.log("init register", req.query);
  // console.log("init register", req.params.id)
  res.json({ email: req.query.email });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
