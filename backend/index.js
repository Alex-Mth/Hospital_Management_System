const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://alexmathew:alexmathew@hospitalcluster.plmlwtw.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Sample Schema
const PatientSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: String
});

const Patient = mongoose.model('Patient', PatientSchema);

// API Endpoint to save patient
app.post('/api/patients', async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        await newPatient.save();
        res.status(201).json({ message: 'Patient saved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save patient' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
