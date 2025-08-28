const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------ MIDDLEWARE ------------------
app.use(cors());
app.use(express.json());
app.use(express.static("frontend")); // serve frontend HTML/CSS

// ------------------ DATABASE CONNECTION ------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "hospitalDB",
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ------------------ ROUTES ------------------
const authRoutes = require("./backend/routes/authRoutes");
const doctorRoutes = require("./backend/routes/doctorRoutes");
const departmentRoutes = require("./backend/routes/departmentRoutes");
const appointmentRoutes = require("./backend/routes/appointmentRoutes");
const reminderRoutes = require("./backend/routes/reminderRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reminders", reminderRoutes);

// ------------------ CRON JOBS ------------------
// Example placeholder (run every minute)
cron.schedule("* * * * *", () => {
  console.log("⏰ Cron job running (placeholder)");
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
