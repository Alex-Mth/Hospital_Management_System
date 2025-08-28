const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, number, email, username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({ firstName, lastName, number, email, username, password });
    await newUser.save();

    res.json({ message: "Signup successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Signin
router.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ message: "Signin successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
