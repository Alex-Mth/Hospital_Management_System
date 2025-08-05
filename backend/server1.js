const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://alexmathew:alexmathew@hospitalcluster.plmlwtw.mongodb.net/', {
   useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schema for Patients
const PatientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String
});

const Patient = mongoose.model('Patient', PatientSchema);

// API: Save a patient to the database
app.post('/api/patients', async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.status(201).json({ message: '✅ Patient saved successfully' });
  } catch (err) {
    console.error('❌ Error saving patient:', err);
    res.status(500).json({ error: 'Failed to save patient' });
  }
});

// ==============================
// 💊 Reminder System Starts Here
// ==============================

let reminders = [];
const filePath = 'reminders.json';

// Load or initialize reminders
if (fs.existsSync(filePath)) {
  reminders = JSON.parse(fs.readFileSync(filePath));
} else {
  fs.writeFileSync(filePath, JSON.stringify([]));
}

// Save reminders to file
function saveReminders() {
  fs.writeFileSync(filePath, JSON.stringify(reminders, null, 2));
}

// Nodemailer setup with Gmail App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'alexmathew1208@gmail.com',
    pass: 'tzmb hwwk cepv eezp' // ⚠️ Replace with your Gmail App Password
  }
});

// Send email function
function sendEmail(reminder) {
  const mailOptions = {
    from: 'alexmathew1208@gmail.com',
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

// Cron: Reset 'sent' flag at midnight
cron.schedule('0 0 * * *', () => {
  reminders.forEach((reminder) => {
    reminder.sent = false;
  });
  saveReminders();
  console.log("🔄 Reset sent status for all reminders.");
});

// Cron: Check reminders every minute
cron.schedule('* * * * *', () => {
  const nowTime = new Date().toTimeString().slice(0, 5); // HH:mm
  let updated = false;

  reminders.forEach((reminder) => {
    if (!reminder.sent && reminder.time === nowTime) {
      sendEmail(reminder);
      reminder.sent = true;
      updated = true;
    }
  });

  if (updated) saveReminders();
});

// API: Receive new reminders
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

// ==============================

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
