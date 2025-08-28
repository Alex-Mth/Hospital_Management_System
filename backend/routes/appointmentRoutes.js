const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');

// @route   POST /api/appointments/book
// @desc    Create a new appointment
router.post('/book', async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    res.status(201).json({ message: 'Appointment booked successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   GET /api/appointments
// @desc    Get all appointments
router.get('/showapp', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/departments
// @desc    Get all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/doctors
// @desc    Get doctors filtered by department
router.get('/doctors', async (req, res) => {
  try {
    const { department } = req.query;
    const doctors = await Doctor.find({ department }).populate("department", "name");
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
