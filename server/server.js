const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const app = express();
const RP_ID = "localhost";
const CLIENT_URL = "http://localhost:5173";

// List of allowed origins
const allowedOrigins = ["http://localhost:5173"];

// CORS options to allow multiple origins
const corsOptions = {
  origin: function (origin, callback) {
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
  const users = readUsersFromFile();
  const user = users.find((user) => user.email === email);

  if (user) {
    return user;
  } else {
    return {};
  }
};

// Helper function to write data to the Users.json file
const writeUsersToFile = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

function createNewUser(newUser) {
  const users = readUsersFromFile();

  // Add basic validation
  if (!newUser.id || !newUser.email) {
    return false;
  }

  // Add new user to the list
  users.push(newUser);
  writeUsersToFile(users);

  return true;
}

function updateUserCounter(email, counter) {
  const user = readUserFromFile(email);
  user.passKey.counter = counter;
}

// Get all users
app.get("/users", (req, res) => {
  const users = readUsersFromFile();
  res.json(users);
});

// Get specific user
app.get("/users/:email", (req, res) => {
  const email = req.params.email;
  const user = readUserFromFile(email);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Create a new user
app.post("/users", (req, res) => {
  const newUser = req.body;

  const created = createNewUser(newUser);

  // Add basic validation
  if (!created) {
    return res.status(400).json({ error: "UserId and email are required" });
  }

  res.status(201).json({ msg: "added user" });
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

app.get("/init-registration", async (req, res) => {
  const user_email = req.query.email;
  // console.log("requested")

  if (!user_email)
    return res.status(400).json({ msg: "No email provided ... " });

  const user = readUserFromFile(user_email);
  if (Object.keys(user).length != 0)
    return res.status(404).json({ msg: "User Already exists ..." });

  const options = await generateRegistrationOptions({
    rpID: RP_ID,
    rpName: "Dj Dips",
    userName: user_email,
  });

  res.cookie(
    "regInfo",
    JSON.stringify({
      userId: options.user.id,
      email: user_email,
      challenge: options.challenge,
    }),
    {
      httpOnly: true,
      maxAge: 60000,
      secure: true,
    }
  );

  res.set("Access-Control-Allow-Origin", "http://localhost:5173");
  res.json(options);
});

app.post("/verify-registration", async (req, res) => {
  const regInfo = JSON.parse(req.cookies.regInfo);

  if (!regInfo)
    return res.status(400).json({ msg: "Registration info not found ... " });

  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge: regInfo.challenge,
    expectedOrigin: CLIENT_URL,
    expectedRPID: RP_ID,
  });

  // console.log("transport while registering" , req.body.transport)

  if (verification.verified) {
    createNewUser({
      id: regInfo.userId,
      email: regInfo.email,
      passkey: {
        id: verification.registrationInfo.credentialID,
        publicKey: verification.registrationInfo.credentialPublicKey,
        counter: verification.registrationInfo.counter,
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
        // transport: req.body.transports,
      },
    }); 

    res.clearCookie("regInfo");
    return res.json({ verified: verification.verified });
  } else {
    return res.status(400).json({ verified: false });
  }
});

app.get("/init-auth", async (req, res) => {
  const user_email = req.query.email;

  if (!user_email)
    return res.status(400).json({ msg: "No email provided ... " });

  const user = readUserFromFile(user_email);

  if (Object.keys(user).length == 0)
    return res.status(404).json({ msg: "User doesnt exists ..." });

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: [
      {
        id: user.passkey.id,
        type: "public-key",
        // transports: user.passkey.transports,
      },
    ],
  });

  res.cookie(
    "authInfo",
    JSON.stringify({
      userId: user.id,
      email: user.email,
      challenge: options.challenge,
    }),
    {
      httpOnly: true,
      maxAge: 60000,
      secure: true,
    }
  );

  res.json(options);
});

app.post("/verify-auth", async (req, res) => {
  const authInfo = JSON.parse(req.cookies.authInfo);

  if (!authInfo)
    return res.status(400).json({ msg: "Authentication info not found ... " });

  const user = readUserFromFile(authInfo.email);
  if (user == null || user.passkey.id != req.body.id) {
    return res.status(400).json({ error: "Invalid User" });
  }

  // console.log(req.body)/
  console.log(
    user.passkey.id,
    "pass key id",
    user.passkey.publicKey,
    " public key",
    user.passkey.counter,
    " counter",
    user.passkey.transports
  , " transports");

  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: authInfo.challenge,
    expectedOrigin: CLIENT_URL,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: user.passkey.id,
      credentialPublicKey: user.passkey.publicKey,
      counter: user.passkey.counter,
      // transports: user.passkey.transports
    }
  });

  if(verification.verified){
    updateUserCounter(user.email, verification.authenticationInfo.newCounter);
    res.clearCookie("authInfo");
    return res.json({verified: verification.verified})
  }else{
    return res.status(400).json({verified: false, error: "Verification failed"})
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
