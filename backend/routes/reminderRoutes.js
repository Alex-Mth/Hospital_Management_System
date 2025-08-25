const express = require("express");
const fs = require("fs");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const router = express.Router();

let reminders = [];
const filePath = "reminders.json";

if (fs.existsSync(filePath)) {
  reminders = JSON.parse(fs.readFileSync(filePath));
} else {
  fs.writeFileSync(filePath, JSON.stringify([]));
}

function saveReminders() {
  fs.writeFileSync(filePath, JSON.stringify(reminders, null, 2));
}

// Email setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "alexmathew1208@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password"
  }
});

function sendEmail(reminder) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: reminder.email,
    subject: "💊 Medication Reminder",
    text: `Hello!\n\nThis is your daily reminder to take:\n\n${reminder.name} - ${reminder.qty} ${reminder.type}\n\nTime: ${reminder.time}\n\nStay healthy!\n- Medication Reminder App`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error(`❌ Email failed:`, error);
    else console.log(`✅ Email sent:`, info.response);
  });
}

// Reset at midnight
cron.schedule("0 0 * * *", () => {
  reminders.forEach(r => r.sent = false);
  saveReminders();
  console.log("🔄 Reset all reminders.");
});

// Check every minute
cron.schedule("* * * * *", () => {
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

// Save reminders
router.post("/", (req, res) => {
  const newReminders = req.body;
  if (!Array.isArray(newReminders)) {
    return res.status(400).json({ error: "Expected an array of reminders" });
  }
  newReminders.forEach(r => r.sent = false);
  reminders.push(...newReminders);
  saveReminders();
  res.status(200).json({ message: "✅ Reminders saved successfully" });
});

module.exports = router;
