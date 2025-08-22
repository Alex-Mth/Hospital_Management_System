const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "hospitalDB"   // 👈 force mongoose to use hospitalDB
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  number:    { type: String, required: true },
  email:     { type: String, required: true },
  username:  { type: String, required: true },
  password:  { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Signup endpoint
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, number, email, username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already exists" });

    const newUser = new User({ firstName, lastName, number, email, username, password });
    await newUser.save();
    res.json({ message: "Signup successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Signin endpoint
app.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ message: "Signin successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ------------------ REMINDER SYSTEM ------------------
let reminders = [];
const filePath = 'reminders.json';

// Load or initialize reminders
if (fs.existsSync(filePath)) {
  reminders = JSON.parse(fs.readFileSync(filePath));
} else {
  fs.writeFileSync(filePath, JSON.stringify([]));
}

function saveReminders() {
  fs.writeFileSync(filePath, JSON.stringify(reminders, null, 2));
}

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'alexmathew1208@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

function sendEmail(reminder) {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'alexmathew1208@gmail.com',
    to: reminder.email,
    subject: '💊 Medication Reminder',
    text: `Hello!\n\nThis is your daily reminder to take:\n\n${reminder.name} - ${reminder.qty} ${reminder.type}\n\nTime: ${reminder.time}\n\nStay healthy!\n- Medication Reminder App`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`❌ Email to ${reminder.email} failed:`, error);
    } else {
      console.log(`✅ Email sent to ${reminder.email}:`, info.response);
    }
  });
}

// Reset sent flag at midnight
cron.schedule('0 0 * * *', () => {
  reminders.forEach(reminder => {
    reminder.sent = false;
  });
  saveReminders();
  console.log('🔄 Reset sent status for all reminders.');
});

// Check reminders every minute
cron.schedule('* * * * *', () => {
  const nowTime = new Date().toTimeString().slice(0, 5);
  let updated = false;

  reminders.forEach(reminder => {
    if (!reminder.sent && reminder.time === nowTime) {
      sendEmail(reminder);
      reminder.sent = true;
      updated = true;
    }
  });

  if (updated) saveReminders();
});

app.post('/api/reminders', (req, res) => {
  const newReminders = req.body;

  if (!Array.isArray(newReminders)) {
    return res.status(400).json({ error: 'Expected an array of reminders' });
  }

  newReminders.forEach(reminder => {
    reminder.sent = false;
  });

  reminders.push(...newReminders);
  saveReminders();
  res.status(200).json({ message: '✅ Reminders saved successfully' });
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
