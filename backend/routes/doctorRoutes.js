// backend/routes/doctorRoutes.js
const express = require("express");
const multer = require("multer");
const Doctor = require("../models/Doctor");

const router = express.Router();

// Multer memory storage (store file buffer in DB, not disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST: Add Doctor
router.post("/adddoctor", upload.single("photo"), async (req, res) => {
  try {
    const { name, specialization, experience, department, email, phone, username, password } = req.body;

    const newDoctor = new Doctor({
      name,
      specialization,
      experience,
      department,
      email,
      phone,
      username,
      password, // ⚠️ hash before storing in production
      photo: req.file ? req.file.buffer : null,
      photoType: req.file ? req.file.mimetype : null
    });

    await newDoctor.save();

    res.status(201).json({
      message: "Doctor added successfully!",
      doctorId: newDoctor._id   // ✅ return doctorId so frontend can fetch photo
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// GET: Doctor photo
router.get("/:id/photo", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor || !doctor.photo) {
      return res.status(404).send("No photo found");
    }

    res.set("Content-Type", doctor.photoType);
    res.send(doctor.photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).send("Server error");
  }
});

// ✅ GET: All Doctors with Department populated
router.get("/dept", async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("department"); // fetch department details
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
