const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ------------------ DATABASE CONNECTION ------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "hospitalDB"   // force mongoose to use hospitalDB
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// ------------------ MODELS ------------------
const User = require("./models/user");     // ✅ import User model
const Doctor = require("./models/Doctor"); // ✅ import Doctor model


// ------------------ AUTH ROUTES ------------------
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, number, email, username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({ firstName, lastName, number, email, username, password });
    await newUser.save();  // 👈 saves into MongoDB

    res.json({ message: "Signup successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


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

if (fs.existsSync(filePath)) {
  reminders = JSON.parse(fs.readFileSync(filePath));
} else {
  fs.writeFileSync(filePath, JSON.stringify([]));
}

function saveReminders() {
  fs.writeFileSync(filePath, JSON.stringify(reminders, null, 2));
}

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

// Reset at midnight
cron.schedule('0 0 * * *', () => {
  reminders.forEach(r => r.sent = false);
  saveReminders();
  console.log('🔄 Reset sent status for all reminders.');
});

// Check every minute
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
  newReminders.forEach(r => r.sent = false);
  reminders.push(...newReminders);
  saveReminders();
  res.status(200).json({ message: '✅ Reminders saved successfully' });
});

// ------------------ DOCTOR ROUTES ------------------
// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add Doctor
app.post("/api/doctor", upload.single("photo"), async (req, res) => {
  try {
    const { name, specialization, experience, email, phone } = req.body;
    const doctor = new Doctor({
      name,
      specialization,
      experience,
      email,
      phone,
      photo: req.file ? {
        data: req.file.buffer,
        contentType: req.file.mimetype
      } : null
    });

    await doctor.save();
    res.json({ message: "Doctor added successfully", doctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Fetch Doctor Photo
app.get("/api/doctor/:id/photo", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor || !doctor.photo || !doctor.photo.data) {
      return res.status(404).send("Photo not found");
    }
    res.set("Content-Type", doctor.photo.contentType);
    res.send(doctor.photo.data);
  } catch (err) {
    res.status(500).send("Error fetching photo");
  }
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
